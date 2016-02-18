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
  props: ['scenario_name'],
  methods: {
    save: function () {
      $('#save-modal').modal('hide');
    }
  }
})

var load_modal_template = Vue.extend({
  template: '#load-modal-template',
  props: ['scenario_name','scenarios'],
})

var modal_button_template = Vue.extend({
  template: '#modal-button-template',
  props: ['scenario_name','scenarios'],
  methods: {
    init: function () {
        alert(1);
    }
  }
})

var send_req_button = Vue.extend({
  template: '#send-req-button',
  props: ['scenarios'],
  methods: {
    send: function () {
        document.getElementById("jsontable").innerHTML = "";
        for (machineNum in vm.machines)
        {
            var machine = vm.machines[machineNum];
            (function(machine){
                $.post("http://" + machine + "/api/cli", {
                    command: $('textarea#cmdtext').val()
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
        scenarios:[]
    },
    components: {
        'machine-list': machineList,
        'save-modal-template': save_modal_template,
        'load-modal-template': load_modal_template,
        'modal-button-template': modal_button_template,
        'send-req-button': send_req_button,
    },
});

