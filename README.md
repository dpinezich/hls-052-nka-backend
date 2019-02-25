# Manual test on heroku

```Bash
curl -X POST https://hls-052-nka-backend.herokuapp.com/save -H 'Content-Type: application/x-www-form-urlencoded' -H 'cache-control: no-cache' -d 'name=Alex&email=alu%40panter.ch'
```
download xlsx file from heroku: https://hls-052-nka-backend.herokuapp.com/auth/download with the credentials provided in the `.env.sample` file

# server routes

- `GET /` - returns the route name
- `POST /save` - you need to send some params to this route and they will be saved in `db.json` file. For the time being i am saving all the params that are sent. When we will have the form defined will allow only those params
example for saving (please replace `[SERVER_URL]` with the actual URL):
```bash
curl -X POST [SERVER_URL]/save -H 'Content-Type: application/x-www-form-urlencoded' -H 'cache-control: no-cache' -d 'name=Alex&email=alu%2B2%40panter.ch'
```
- `GET /auth/download` - will download the excel file after the user provides the credentials set in `.env` file

# Sending emails

In order to be able to send email you need to copy `.env.sample` to `.env` and adjust the values inside