import jinja2
from fastapi import FastAPI, Request
from workers import WorkerEntrypoint

environment = jinja2.Environment()
template = environment.from_string("Hello, {{ name }}!")
