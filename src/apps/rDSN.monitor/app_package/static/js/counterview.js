//parameter parsing function
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

//time operation
function strtoms(str){
        var arr = str.split(":");
        var arr2 = arr[2].split(".");
        return ((Number(arr[0]) * 60 + Number(arr[1])) * 60 + Number(arr2[0])) * 1000 + Number(arr2[1]);
}

function mstostr(milli){
        var hr= ("00" + Math.floor((milli / (60 * 60 * 1000))%24).toString()).substr(-2,2);
        var min= ("00" + Math.floor((milli / (60 * 1000))%60).toString()).substr(-2,2);
        var sc= ("00" + Math.floor((milli / 1000)%60).toString()).substr(-2,2);
        var ms=  ("00" + (milli %1000).toString()).substr(-3,3);
        return hr + ":" + min + ":" + sc + "." + ms; 
}

function calcdiffms(time1,time2){
    var res = strtoms(time2) - strtoms(time1);
    if (res<0)
        return (res + 24*60*60*1000);
    return res;
}

function addmstostr(str,ms){
    return mstostr(strtoms(str)+ms);
}

function nstostr(ns){
    return mstostr(Math.floor(ns/1000000));
}

//c3js chart
var chart;

var viewChart = Vue.extend({
  template: '',
  props: ['counterlist','graphtype','interval','currentValue','currentTime','stopFlag','info','updateSlotFunc'],
  data: function () {
      return {
          NextSlot: [['x', 1]],
      }
  },
  methods: {
      bar_init: function () {
        chart = c3.generate({
            data: {
                columns: [],
                type: 'bar',
            },
            grid: {
                y: {
                    lines: [{value:0}]
                }
            },
            bar: {
                width: 100 
            },
            axis: {
                x: {
                    label: 'counter',
                },
                y:{
                    tick: {
                        format: d3.format(",")
                    }
                }
            }
        });

        var self = this;
        this.updateSlotFunc = [];
        for (counter in this.counterlist)
        {
            var newSlotUpdateFunc = setInterval(function (count) {
                self.update_slot(count);
                }, self.interval*1000, counter);
            this.updateSlotFunc.push(newSlotUpdateFunc);
        }
        this.bar_update_graph();
      },
      bar_update_graph: function ()
      {
        for (counter in this.counterlist)
        {
            try{
                var name = this.counterlist[counter]['name'];
                chart.load({
                    rows: [
                    [name],
                    [this.currentValue[counter]]
                    ],
                });
            }
            catch(err){}
        }
        var self = this;
        setTimeout(function () {
            if (!self.stopFlag)
                self.bar_update_graph();
        }, self.interval * 1000);

      },
      realtime_init: function () {
        var BaseArray = Array.apply(null, Array(20)).map(function (_, i) {return (i+1).toString();});
        BaseArray.unshift('x');
        BaseArray = [BaseArray];

        this.NextSlot = [['x', 1]];
        this.currentValue = [];
        this.currentTime = [];

        for (counter in this.counterlist)
        {
            var name = this.counterlist[counter]['name'];
            var BaseArrayAdd = Array.apply(null, Array(20)).map(function (_, i) {return 0;});
            BaseArrayAdd.unshift(name);
            BaseArray.push(BaseArrayAdd);
            this.NextSlot.push([name, 0]);
            this.currentValue.push(0);
            this.currentTime.push(0);
        }

        chart = c3.generate({
            data: {
                x: 'x',
                columns: BaseArray
            },
            axis: {
                x: {
                    show:false
                }
            }
        });

        var self = this;
        this.updateSlotFunc = [];
        for (counter in this.counterlist)
        {
            var newSlotUpdateFunc = setInterval(function (count) {
                self.update_slot(count);
                }, self.interval*1000, counter);
            this.updateSlotFunc.push(newSlotUpdateFunc);
        }
        this.realtime_update_graph(19);
      },
      realtime_update_graph: function (index)
      {
        var self = this;
        if(index>80)
        {
            for (counter in this.counterlist)
            {
                clearInterval(this.updateSlotFunc[counter]);
            }
            chart = chart.destroy();
            this.realtime_init();
        }
        chart.xgrids.add([{value: index+1, text:self.currentTime[0],class:'hoge'}]);
        chart.flow({
            columns: this.NextSlot,
            duration: this.interval*1000,
            done:function(){
                if (!self.stopFlag)
                    self.realtime_update_graph(index+1);
            }
        });
      },
      update_slot : function (counter)
      {
        var machine = this.counterlist[counter]['machine'];
        var index = this.counterlist[counter]['index'];
        var name = this.counterlist[counter]['name'];
        
        var self = this;
        $.post("http://" + machine + "/api/cli", {
            command: "counter." + ((self.graphtype=='bar')?'value':self.graphtype) + "i " + index
        }, function(data){
            try {
                data = JSON.parse(data);
            }
            catch(err) {
                data = {'val':'Invalid Data','time':'Invalid Data'};
            }

            self.currentValue.$set(counter, data['val']);
            self.currentTime.$set(counter, nstostr(data['time']));
            if(self.graphtype!='bar')
                self.NextSlot[Number(counter)+1][1]=data['val'];
        })
        .fail(function() {
            self.stopFlag = 1;
            for (counter in self.counterlist)
            {
                clearInterval(self.updateSlotFunc[counter]);
            }
            self.info = "Error: lost connection to the server " + machine;
            $('#info-modal').modal('show');
            return;
        });
      },
  },
  ready: function () {
      this.counterlist = JSON.parse(getParameterByName('counterList'));
      this.graphtype = getParameterByName('graphtype');
      this.interval = getParameterByName('interval');
  }
})

var opButton = Vue.extend({
  template: '#opButton',
  props: ['stopFlag'],
  methods: {
    newWindow: function () {
        window.open(location.search);
    },
    stop: function () {
        this.stopFlag = 1 - this.stopFlag;
    }
  },
})

var vm = new Vue({
    el: '#app',
    data:{
        viewname: '',
        counterlist: {},
        graphtype: '',
        interval: '',
        currentValue: [],
        currentTime: [],
        stopFlag: 0,
        info: '',
        updateSlotFunc: [],
    },
    components: {
        'view-chart': viewChart,
        'op-button': opButton,
    },
    ready: function () {
        this.viewname = getParameterByName('viewname');
        if (getParameterByName('graphtype')=='sample' || getParameterByName('graphtype')=='value')
            this.$refs.viewChart.realtime_init();   
        else if (this.graphtype=='bar')
            this.$refs.viewChart.bar_init();   
    },
});

