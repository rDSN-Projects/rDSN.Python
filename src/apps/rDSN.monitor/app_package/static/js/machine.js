var vm = new Vue({
    el: '#app',
    data:{
        nodeList: [],
        partitionList: [],
        updateTimer: 0,
        info: ''
    },
    components: {
    },
    methods: {
        update: function()
        {
            var self = this;
            $.post("/api/cli", {
                command: 'meta.list_nodes'
            }, function(nodedata){
                try {
                    //self.nodeList = JSON.parse(nodedata);
                    self.$set('nodeList', JSON.parse(nodedata))
                }
                catch(err) {
                }
                for (node in self.nodeList.infos)
                {
                    (function(nodeIndex){
                        $.post("/api/cli", {
                            command: 'meta.query_config_by_node {"req":{"node":"' + self.nodeList.infos[nodeIndex].address +'"}}'
                        }, function(servicedata){
                            try {
                                self.partitionList.$set(nodeIndex, JSON.parse(servicedata))
                            }
                            catch(err) {
                                return;
                            }
                            
                            for (partition in self.partitionList[nodeIndex].partitions)
                            {
                                var par = self.partitionList[nodeIndex].partitions[partition];
                                par.role = '';
                                par.working_point = '';

                                if(par.package_id=='')
                                {
                                    //stateful service
                                    if (par.primary == self.nodeList.infos[nodeIndex].address)
                                    {
                                        par['role'] = 'primary';
                                    }
                                    else if (par.secondaries.indexOf(self.nodeList.infos[nodeIndex].address) > -1)
                                    {
                                        par['role'] = 'secondary';
                                    }
                                    else if (par.last_drops.indexOf(self.nodeList.infos[nodeIndex].address) > -1)
                                    {
                                        par['role'] = 'drop';
                                    }
                                    else
                                        par['role'] = 'undefined';
                                }
                                else
                                {
                                    par['working_point'] = par.last_drops[par.secondaries.indexOf(self.nodeList.infos[nodeIndex].address)];
                                }
                            }

                        })
                        .fail(function() {
                        });
                    })(node);
                }
            })
            .fail(function() {
                clearInterval(self.updateTimer);
                self.info = "Error: lost connection to the server";
                $('#info-modal').modal('show');
                return;
            });


        },
        del: function (address, role, gpid)
        {
            var self = this;
                
            console.log(((role!='')?'replica.':'daemon.') + "kill_partition " + gpid.app_id + " " + gpid.pidx);
            console.log(role);
            $.post("http://" + address + "/api/cli", {
                command: ((role!='')?'replica.':'daemon1.') + "kill_partition " + gpid.app_id + " " + gpid.pidx
            }, function(data){
                try {
                }
                catch(err) {
                }
            })
            .fail(function() {
                self.info = "Error: lost connection to the server";
                $('#info-modal').modal('show');
                return;
            });
        }
    },
    ready: function ()
    {
        var self = this;
        self.update(); 
        //query each machine their service state
        updateTimer = setInterval(function () {
           self.update(); 
        }, 1000);
    }
});

