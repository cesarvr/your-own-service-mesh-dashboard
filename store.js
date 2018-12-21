'use strict'

class SimpleStrategy {
  constructor(){
    this.store = {}
  }
  save(key, values){
    this.store[key] = values
  }
  keys() {
    return Object.keys(this.store)
  }
  remove(key) {
    delete this.store[key]
  }
  get all() {
    return this.store
  }
}

class StatsStrategy extends SimpleStrategy {
  save(key, values) {
    console.log('v->', Object.keys(values))
    this.store[key] = this.store[key] || []
    values.stats.forEach(value => this.store[key].push(value))
  }
}


class Store {
  constructor({strategy}) {
    this.storeStrategy = strategy
    this.pod_updates = {}
  }

  get all() {
    return this.storeStrategy.all
  }

  keys() {
    return Object.keys(this.pod_updates)
  }

  update(key, value) {
    this.pod_updates[key] = { last_update: new Date().getTime() }
    this.storeStrategy.save(key, value)
  }

  removeOutdated(key, time) {
    let time_since_last_update = new Date().getTime() - this.pod_updates[key].last_update
    console.log(`key ${key} -> time_since_last_update ${time_since_last_update} > time ${time} `)
    if (time_since_last_update > time) {
      this.storeStrategy.remove(key)
      return true
    } else
      return false
  }
}

class DashboardController {
  constructor({store}){
    this.store = store
  }
  post(req, res) {
    let obj = req.body
    if (obj) {
      this.store.update(obj.pod, obj)
      res.status(200).send({
        response: 'saved'
      })
    } else
      res.status(304)
  }

  get(req, res) {
    res.status(200).send(this.store.all)
  }
}



module.exports = {
  DashboardController,
  SimpleStore: ()=> new Store({strategy: new SimpleStrategy()}),
  AppendStore: ()=> new Store({strategy: new StatsStrategy()}),
}
