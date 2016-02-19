var machineList = Vue.extend({
  template: '#machine-list',
  props: ['machines','newMachine'],
  methods: {
    add: function () {
      var value = this.newMachine && this.newMachine.trim();
	  if (!value) {
	    return;
	  }
	  this.machines.push(value);
	  this.newMachine = '';
    },

    remove: function (machine) {
	  this.machines.$remove(machine);
	}
  }
})

var save_modal_template = Vue.extend({
  template: '#save-modal-template',
  props: ['scenario_name','machines','cmdtext','name','author','description','info'],
  methods: {
    save: function () {
        $('#save-modal').modal('hide');
        if (this.name=="")
        {
            this.info = 'Error: Name must be specified';
            $('#info-modal').modal('show');
            return;
        }
        
        var thisp = this;
        $.post("/api/scenario/save", {
                name: this.name,
                author: this.author,
                description: this.description,
                machines: JSON.stringify(this.machines),
                cmdtext: this.cmdtext,
            }, function(result){
                thisp.info = result;
                $('#info-modal').modal('show');
            }
        )
        .fail(function() {
            thisp.info = "Error: lost connection to the server";
            $('#info-modal').modal('show');
            return;
        });
    }
  }
})

var load_modal_template = Vue.extend({
  template: '#load-modal-template',
  props: ['scenario_name','scenarios','name','description','author','machines','cmdtext'],
  methods: {
    load: function (scenario) {
        this.name = scenario.name;
        this.author = scenario.author;
        this.description = scenario.description;
        this.machines = scenario.machines;
        this.cmdtext = scenario.cmdtext;

        this.ready = true;
        $('#load-modal').modal('hide');
    },
    remove: function (scenario) {
        var thisp= this;
        $.post("/api/scenario/del", {
        name: scenario.name
        }, function(data){
            if (data == 'success')
            {
                var index = thisp.scenarios.indexOf(scenario);
                if (index > -1) {
                    thisp.scenarios.splice(index, 1);
                }
            }
        }
        );
    }
  }
})

var modal_button_template = Vue.extend({
  template: '#modal-button-template',
  props: ['scenario_name','scenarios','info'],
  methods: {
    init: function () {
        var thisp = this;
        $.post("/api/scenario/load", {
            }, function(data){
                var message = JSON.parse(data);
                thisp.scenarios = [];
                for (var i = 0; i < message.length; i++) {
                    thisp.scenarios.push({
                        name: message[i].name,
                        description: message[i].description,
                        author: message[i].author,
                        machines: JSON.parse(message[i].machines),
                        cmdtext: message[i].cmdtext
                    });
                }
                $('#load-modal').modal('show');
            }
        )
        .fail(function() {
            thisp.info = "Error: lost connection to the server";
            $('#info-modal').modal('show');
            return;
        });
    }
  }
})

var send_req_button = Vue.extend({
  template: '#send-req-button',
  props: ['machines','cmdtext','interval','times'],
  methods: {
    send: function () {
        document.getElementById("jsontable").innerHTML = "";
        
        var thisp = this;
        for (machineNum in this.machines)
        {
            var machine = this.machines[machineNum];
            (function(machine){
                $.post("http://" + machine + "/api/cli", {
                    command: thisp.cmdtext
                }, function(data){
                    var resp = {};
                    try {
                        data = JSON.parse(data);
                    } catch (e){
                    }
                    resp[machine] = data;
                    var node = JsonHuman.format(resp);
                    document.getElementById("jsontable").appendChild(node);
                }
                );
            })(machine);
        }
    }
  }
})

var vm = new Vue({
    el: '#app',
    data:{
        machines:[],
        scenarios:[],
        cmdtext:'',
        interval:'',
        times:'',
        name:'',
        author:'',
        description:'',
        info:''
    },
    components: {
        'machine-list': machineList,
        'save-modal-template': save_modal_template,
        'load-modal-template': load_modal_template,
        'modal-button-template': modal_button_template,
        'send-req-button': send_req_button,
    },
});

