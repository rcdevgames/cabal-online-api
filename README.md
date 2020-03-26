# Cabal Online API

REST API built using NodeJS for Cabal Online.

## Features

* Register an account
* Credentials validation and JWT generation
* Validating JWT

## Requirements

* Latest stable version of NodeJS installed.
* Cabal Online MSSQL database running.

## Running the project

* Clone or download the project to a directory.
* Run ``npm install`` to install code dependencies.
* Create ``development.json`` or ``production.json`` inside ``config`` folder depending upon your server environment to override default config options if needed.
* Run ``npm start`` to start the API server.

## Endpoints

| Endpoint          | Method | Description          | Params                    | JWT Required
| ----------------- | ------ | -------------------- | ------------------------- | -------------
| /                 | GET    | API version and name | -                         | No
| /account/me       | GET    | Validate token       | -                         | Yes
| /account/register | POST   | Register an account  | username, password, email | No
| /account/login    | POST   | Receive JWT          | username, password        | No

JWT token has to be sent in ``Authorization`` header with ``Bearer`` prefix for all routes where JWT is required.

## Clients

The following are the clients available for the API

* Web client: https://github.com/cyberinferno/cabal-online-api-client
