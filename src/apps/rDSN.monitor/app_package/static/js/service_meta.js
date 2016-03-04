var vm = new Vue({
    el: '#app',
    data:{
        appList: [],
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
                command: 'meta.list_apps'
            }, function(appdata){
                try {
                    self.$set('appList', JSON.parse(appdata))
                }
                catch(err) {
                }
                for (app in self.appList.infos)
                {
                    (function(app){
                        $.post("/api/fakecli", {
                            command: 'meta.query_config_by_app ' + self.appList.infos[app].app_name
                        }, function(servicedata){
                            try {
                                self.$set('partitionList[app]', JSON.parse(servicedata))

                                //console.log(JSON.stringify(self.partitionList[app]));
                                //console.log(servicedata);
                                //console.log(JSON.stringify(self.partitionList));
                            }
                            catch(err) {
                                //console.log(err+ ' '+ servicedata);
                                return;
                            }
                            
                            //console.log(JSON.stringify(self.partitionList));
                            for (partition in self.partitionList[app].partitions)
                            {
                                var par = self.partitionList[app].partitions[partition];
                                par.membership = '';

                                if(par.primary!='invalid address')
                                {
                                    par.membership += 'P: ("' + par.primary + '"), ';
                                    
                                }
                                else
                                {
                                    par.membership += 'P: (), ';
                                }

                                par.membership += 'S: [';
                                for (secondary in par.secondaries)
                                {
                                    par.membership += '"' + par.secondaries[secondary]+ '",'
                                }
                                par.membership += '],';

                                par.membership += 'D: [';
                                for (drop in par.last_drops)
                                {
                                    par.membership += '"' + par.last_drops[drop]+ '",'
                                }
                                par.membership += ']';
                            }

                        })
                        .fail(function() {
                        });
                    })(app);
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
        self.updateTimer = setInterval(function () {
           self.update(); 
        }, 1000);
    }
});

