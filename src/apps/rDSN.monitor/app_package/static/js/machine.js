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
            $.post("/api/fakecli", {
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
                    (function(node){
                        $.post("/api/fakecli", {
                            command: 'meta.query_config_by_node ' + self.nodeList.infos[node].address
                        }, function(servicedata){
                            try {
                                self.$set('partitionList[node]', JSON.parse(servicedata))
                                //console.log(JSON.stringify(self.partitionList));
                            }
                            catch(err) {
                                //console.log(err+ ' '+ servicedata);
                                return;
                            }
                            
                            for (partition in self.partitionList[node].partitions)
                            {
                                self.partitionList[node].partitions[partition].role = '';
                                self.partitionList[node].partitions[partition].working_point = '';

                                if(self.partitionList[node].partitions[partition].package_id=='')
                                {
                                    //stateful service
                                    if (self.partitionList[node].partitions[partition].primary == self.nodeList.infos[node].address)
                                    {
                                        self.partitionList[node].partitions[partition]['role'] = 'primary';
                                    }
                                    else if (self.partitionList[node].partitions[partition].secondaries.indexOf(self.nodeList.infos[node].address) > -1)
                                    {
                                        self.partitionList[node].partitions[partition]['role'] = 'secondary';
                                    }
                                    else if (self.partitionList[node].partitions[partition].last_drops.indexOf(self.nodeList.infos[node].address) > -1)
                                    {
                                        self.partitionList[node].partitions[partition]['role'] = 'drop';
                                    }
                                    else
                                        self.partitionList[node].partitions[partition]['role'] = 'undefined';
                                }
                                else
                                {
                                    //console.log(JSON.stringify(self.partitionList[node]));
                                    self.partitionList[node].partitions[partition]['working_point'] = self.partitionList[node].partitions[partition].last_drops[self.partitionList[node].partitions[partition].secondaries.indexOf(self.nodeList.infos[node].address)];
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
                command: ((role!='')?'replica.':'daemon.') + "kill_partition " + gpid.app_id + " " + gpid.pidx
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

