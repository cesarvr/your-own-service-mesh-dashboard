Vue.component('cpu', {
  props: ['cpu', 'core_count'],
  data: function(){
    return { load: 0, barStyle: 'width: 0px' }
  },
  watch: {
    'cpu.times': function(newValue, oldValue){

      if(oldValue){
        let user = newValue.user - oldValue.user
        let sys = newValue.sys - oldValue.sys
        let idle = newValue.idle - oldValue.idle
        _load = (1 - ( idle / (user+sys+idle) ) ) * 100
        _load = Math.round(_load)
      }

      if(_load === NaN)
        _load = 0

      this.barStyle = `width: ${_load}%`
      this.load = _load
    }
  },
  template: `
      <div class="cpu-times" >
        <p class="core-display">Core: {{core_count}} Load: {{load}}%</p>
        <div class="progress" style="height: 5px;">
          <div class="progress-bar" role="progressbar" :style="barStyle" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
          </div>
        </div>
      </div>
      `
})


Vue.component('memory', {
  props: ['free', 'total'],
  computed: {
    mem: function(newValue) {
      let x = (this.free / this.total) * 100
      return `width: ${x}%`
    }
  },
  template: `
      <div class="memory">
        <p class="core-display">Memory</p>
        <div class="progress" style="height: 10px;">
          <div class="(progress-bar, index) bg-success"  v-bind:style="mem" ></div>
        </div>
      </div>
      `
})

Vue.component('stats', {
  props:['service', 'podName'],
  computed: {
    stats: function(){
      let name = this.podName
      if(this.service[name] !== undefined) {
        return this.service[name]
                   .reduce(statsReducer, {})
      }else
        return {}
    }
  },
  template: `
          <div class="list-group list-group-flush" style="overflow-x: auto; height: 221px;">
            <a v-for="value in stats"
                :style="{'border-color': (value.alert === '#c90000')? '#c90000' : '#F4F6F6' }"
                class="list-group-item flex-column align-items-start"
                v-bind:class="value.css">
                <p class="core-display">{{value.URL}} </p>

                <svg height="25" width="30" style="float: right;">
                  <circle cx="20" cy="12" r="4" stroke="black" stroke-width="1" :fill="value.alert">
                  </circle>
                </svg>
                <p class="core-display">hits {{value.count}}</p>
                <small class="text-muted">average latency: {{value.avg}}ms</small>

            </a>
          </div>
      `
})

Vue.component('pod', {
  props: ['telemetry', 'service'],
  template: `<div class="card" style="float:right; width: 300px; margin: 10px">
              <div class="card-body">
                <h6 class="card-title">{{ telemetry.pod }}</h6>
                  <stats :service="service" :podName="telemetry.pod"> </stats>
                  <memory :free="telemetry.resource.free_memory"
                          :total="telemetry.resource.total_memory">
                  </memory>

                  <cpu v-for="(cpu, index) in telemetry.resource.cpus" :key="index"
                       v-bind:core_count="index"
                       v-bind:cpu="cpu">
                  </cpu>
              </div>
            </div>
          `
})

let dashboard = new Vue({
  el: '#container',
  data: {
    telemetry: {},
    service: {}
  },
  created: function () {
    this.getTelemetry()
    this.getStats()
  },
  methods: {
    getTelemetry: function() {
      setInterval(() =>
        $.get('/resources', (data) => { dashboard.telemetry = data }), 2000)
    },
    getStats: function(){
      setInterval(() =>
        $.get('/stats', (data) => {
          dashboard.service = data
        }), 2000)
    }
  }
})

function statsReducer(acc, next) {
  //initialize
  let fields = { URL:  next.endpoint,
                 time:  0,
                 count: 0,
                 max: 0,
                 min: 0,
                 avg: 0   }

  acc[next.endpoint] = acc[next.endpoint] || fields
  let entry = acc[next.endpoint]
  entry.time += next.time
  entry.count += 1
  entry.avg += Number((next.time / entry.count).toFixed(2))
  entry.max = Math.max(entry.max, next.time)
  entry.min = Math.min(entry.min, next.time)

  /* Alerts */
  if(entry.avg < 100)
    entry.alert = '#afdf68'
  if(entry.avg > 500 && entry.avg < 1000)
    entry.alert = '#f7f2b8'
  if(entry.avg > 1000)
    entry.alert = '#c90000'

  return acc
}
