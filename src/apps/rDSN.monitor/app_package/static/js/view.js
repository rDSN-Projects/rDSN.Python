function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

var graphtype = getParameterByName('graphtype');
if (graphtype=='sample' || graphtype=='value')
{
    realtimeDisplay(graphtype);   
}
else if (graphtype=='bar')
{
    barDisplay();   
}

function barDisplay(){
    var counterList = JSON.parse(getParameterByName('counterList'));
    var tabledata=[]
        for (counter in counterList)
        {
            var machine = counterList[counter]['machine'];
            var index = counterList[counter]['index'];
            var name = counterList[counter]['name'];
            (function(name){
                $.post("http://" + machine + "/api/cli", {
                    command: "counter.valuei " + index
                }, function(data){
                    tabledata.push([name, data]);
                }
                );
            })(name);
        }

    $(document).ajaxComplete(function() {
        var chart = c3.generate({
            /*size: {
              height: 720,
              },*/
            data: {
                columns: tabledata,
            type: 'bar',
            },
            grid: {
                y: {
                    lines: [{value:0}]
                }
            },
            bar: {
                //width: {
                //  ratio: 0.5 // this makes bar width 50% of length between ticks
                //}
                // or
                width: 100 // this makes bar width 100px
            },
            axis: {
                x: {
                    //type: 'category',
                    label: 'counter',
                    /*tick: {
                      rotate: 75,
                      multiline: false
                      },*/
                    //categories: [{% for item in QUEUE_LIST %}'{{item}}',{% endfor %}]
                    //categories: ['RPC_NFS_COPY', 'RPC_NFS_GET_FILE_SIZE', 'RPC_DSN_CLI_CALL']
                },
                y:{
                    //label: 'queue length',
                    tick: {
                        format: d3.format(",")
                    }
                }
            }
        });
    });

}

function realtimeDisplay(graphtype){
    var counterList = JSON.parse(getParameterByName('counterList'));
    var tabledata=[]
    for (counter in counterList)
    {
        var machine = counterList[counter]['machine'];
        var index = counterList[counter]['index'];
        var name = counterList[counter]['name'];
        (function(name){
            $.post("http://" + machine + "/api/cli", {
                command: "counter.valuei " + index
            }, function(data){
                tabledata.push([name, data]);
            }
            );
        })(name);
    }

    var basedata = [
        ['x', '1', '2', '3','4','5','6','7','8','9','10', '11', '12', '13','14','15','16','17','18','19'],
    ]
    var latestdata=[['x', 1]]
    var time='';
    var chart = c3.generate({
        data: {
            x: 'x',
            columns: basedata
        },
        axis: {
            x: {
                show:false
            }
        }
    });
    var checkedItemsIndex = {}, checkedItemsText={}, counter = 0;

    function updateData(a)
    {
        $.post("selection.html", {counter_list: JSON.stringify(checkedItemsIndex, null, '\t')}, function(result){
            latestdata = [['x', a]]
            parsed_data = JSON.parse(result)
            for (i=0;i<counter;++i){
                latestdata.push([checkedItemsText[i],parsed_data.data[i]]);
            }
        time = parsed_data.time;

        });
        chart.flow({
            columns: latestdata,
            duration:1000,
            done:function(){
                setTimeout(function () {
                    chart.xgrids.add([{value: a, text:time,class:'hoge'}]);
                    updateData(a+1);

                }, 0);}
        });
    }
}
