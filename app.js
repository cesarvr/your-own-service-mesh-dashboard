const express = require('express')
const bodyParser = require('body-parser')
const { DashboardController, SimpleStore, AppendStore } = require('./store')
const app = express()
const port = 8080

app.use(express.static('static'))

app.use(bodyParser.urlencoded({
  extended: false
}));

// parse application/json
app.use(bodyParser.json())

let resources = SimpleStore()
let statsController = new DashboardController({store: AppendStore() })
let resController = new DashboardController({store: resources })

app.get('/stats',  (req, resp) => statsController.get(req,resp)  )
app.post('/stats', (req, res)  => statsController.post(req, res) )

app.get('/resources', (req, resp) => resController.get(req, resp) )
app.post('/resources', (req, res)=> resController.post(req, res) )

setInterval( () => {
  console.log('checking pods health')
  resources.keys().forEach(key => resources.removeOutdated(key, 2000))
}, 3000)


app.listen(port, () => console.log(`Listening: ${port}!`))
