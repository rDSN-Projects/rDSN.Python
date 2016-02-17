var machineList = new Vue({
  el: '#machineList',
  data: {
      machines:[]
  },
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

var jsontable = new Vue({
  el: '#jsontable',
  data: {
      tableContent: "" 
  }
})

function SendReqAll() {
    document.getElementById("jsontable").innerHTML = "";
    for (machineNum in machineList.machines)
    {
        SendReqSingle(machineList.machines[machineNum]);
    }
}

function SendReqSingle(machine)
{
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


