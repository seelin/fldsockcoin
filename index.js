
/**
 * Welcome to Cloudflare Workers! This is your first worker.
 * Learn more at https://developers.cloudflare.com/workers/
 */
//import Buffer from 'node:buffer';
var dHeader={"Access-Control-Allow-Origin": "*"};
var tHeader={"Access-Control-Allow-Origin": "*","Content-Type": "text/html;charset=UTF-8"};
var SK_ESHOST="https://api.etherscan.io/v2/api";
var SK_ESTOKEN="VZF13T4M4NCUJF1M46BG4Q66EHY3SZFC7Y";
var SK_EXCKEY='6c15c49ccf84b892391a9e8d';
var SK_CMCKEY="d15bcfdf-9b59-4f4c-8296-dffd8f77d89d";

function base64_decode(scode){
  //return Buffer.from(scode, 'base64').toString("utf-8");
  try {
    let rcode=Buffer.from(scode, 'base64').toString("utf-8");
    return rcode;
  }catch (err) {
    return false;
  }
}

function base64_encode(scode){
    let encoded = Buffer.from(scode).toString('base64');
    return scode;
}

function is_bool(sobj){
  return (typeof sobj === 'boolean')?true:false;
}

function is_base64(scode) {
  try {
      let scode=Buffer.from(scode, 'base64').toString("utf-8");
      return true;
  } catch (err) {
      return false;
  }
}

function check_base64(scode){
  return true;
  //return new Response("params error ", {headers: {"Content-Type": "text/html;charset=UTF-8"}});
}

async function handleErrors(request, func) {
  try {
    return await func();
  } catch (err) {
    if (request.headers.get("Upgrade") == "websocket") {
      // Annoyingly, if we return an HTTP error in response to a WebSocket request, Chrome devtools
      // won't show us the response body! So... let's send a WebSocket response with an error
      // frame instead.
      let pair = new WebSocketPair();
      pair[1].accept();
      pair[1].send(JSON.stringify({error: err.stack}));
      pair[1].close(1011, "Uncaught exception during session setup");
      return new Response(null, { status: 101, webSocket: pair[0] });
    } else {
      return new Response(err.stack, {status: 500});
    }
  }
}

export default {
  async fetch(request, env, ctx) {
    SK_ESTOKEN = env.SK_ESTOKEN||'';
    SK_CMCKEY = env.SK_CMCKEY||'';
    SK_EXCKEY = env.SK_EXCKEY||'';

    return await handleErrors(request, async () => {
      let url = new URL(request.url);
      let path = url.pathname.slice(1).split('/');
      let sobj = url.searchParams;
      let pobj={args:sobj,path:path.slice(1)}

      if (!path[0]) {
        return new Response("hello world!", {headers:tHeader});
      }

      switch (path[0]) {
        case "api":
          return handleApiRequest(path.slice(1), request, env);
        case "geturl":  
          return get_url(pobj, request, env);
        case "getbal":  
          return get_bal(pobj, request, env);
        case "gettkbal":  
          return get_tkbal(pobj, request, env);
        case "getprice":  
          return get_price(pobj, request, env); 
        case "getcmcurl":  
          return get_cmcurl(pobj, request, env);                   
        default:
          return new Response("Not found", {status: 404});
      }
    });    
    
  }
};

async function get_url(pobj, request, env) {
  let url = new URL(request.url);
  let tourl = url.searchParams.get('tourl');
  tourl=base64_decode(tourl);
  if(!tourl||is_bool(tourl)){
    return new Response("tourl error", {headers:tHeader});
  }
  let res = await fetch(tourl);
  return new Response(res.body, {headers:dHeader});
}

async function get_bal(pobj, request, env) {
  let addr=pobj.args.get('addr')||'';
  addr=base64_decode(addr);
  if(addr==''||is_bool(addr)){
    return new Response("addr error"+addr, {headers: dHeader});
  }
  //addr = base64_decode(addr);
  let chainid=pobj.args.get('chainid')||1;
  let tourl=SK_ESHOST+"?chainid="+chainid+"&module=account&action=balance&address="+addr+"&tag=latest&apikey="+SK_ESTOKEN;
  //return new Response(tourl, {headers: {"Access-Control-Allow-Origin": "*"}});
  let res = await fetch(tourl);
  return new Response(res.body, {headers: dHeader});
}

async function get_tkbal(pobj, request, env) {
  let addr=pobj.args.get('addr')
  addr=base64_decode(addr);
  if(addr==''||is_bool(addr)){
    return new Response("addr error", {headers:tHeader});
  }  
  
  let tkaddr=pobj.args.get('tkaddr');
  tkaddr=base64_decode(tkaddr);
  if(tkaddr==''||is_bool(tkaddr)){
    return new Response("tkaddr error", {headers:tHeader});
  } 
 
  let chainid=pobj.args.get('chainid')||1;
  let tourl=SK_ESHOST+"?chainid="+chainid+"&module=account&action=tokenbalance&contractaddress="+tkaddr+"&address="+addr+"&tag=latest&apikey="+SK_ESTOKEN;
  let res = await fetch(tourl);
  //return new Response(tourl, {headers: dHeader}); 
  return new Response(res.body, {headers: dHeader});  
}

async function get_price(pobj, request, env){
  let chainid=pobj.args.get('chainid')||1;
  let tourl=SK_ESHOST+"?chainid="+chainid+"&module=stats&action=ethprice&apikey="+SK_ESTOKEN
  let res = await fetch(tourl);
  return new Response(res.body, {headers:dHeader});  
}

async function get_cmcurl(pobj, request, env){
  let headers = {'Accepts': 'application/json','X-CMC_PRO_API_KEY': SK_CMCKEY}
  let tourl=pobj.args.get('tourl')
  if (tourl==''){
    tourl='/v1/cryptocurrency/listings/latest'
  }else{
    tourl=base64_decode(tourl);
    if(is_bool(tourl)){
      return new Response("tourl error", {headers:tHeader});
    } 
  } 
  tourl = 'https://pro-api.coinmarketcap.com'+tourl;
  //let parameters={};
  let partxt=pobj.args.get('partxt')
  if (partxt!=''){
     partxt=base64_decode(partxt);
     if(is_bool(partxt)){
      return new Response("partxt error", {headers:tHeader});
     }
    //parameters=JSON.parse(partxt);
    let spt = (tourl.indexOf('?')>-1)?'&':'?';
    tourl=tourl+spt+partxt;
  }   
  let res = await fetch(tourl,{method: 'GET',headers: headers});
  //return new Response(tourl, {headers: dHeader}); 
  return new Response(res.body, {headers:dHeader});  
}

async function handleApiRequest(path, request, env) {
  switch (path[0]) {
    case "room": {

    }
  }
}
