facrest
=======

A basic mongo/restify-based facility data repository and API.

At the moment, this is purely for testing purposes, hence the blatant lack of structure.

### Usage

1) Make sure mongo daemon is running

```
> mongod
```

2) Install npm packages

```
> npm install
```


3) Start the server

```
> grunt server
```

### Load sample data

By default the server uses a mongo database called *sel*. You can load in the sample kenya data via mongoimport:

```
> mongoimport -d sel -c facilities data/kenya.json
```