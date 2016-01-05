function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

var graphtype = getParameterByName('graphtype');
var interval = getParameterByName('interval');
if (graphtype=='sample' || graphtype=='value')
{
    
    realtimeDisplay();   
}
else if (graphtype=='bar')
{
    barDisplay();   
}


var chart;
function barDisplay(){
    var counterList = JSON.parse(getParameterByName('counterList'));
    var tabledata=[]

    chart = c3.generate({
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

        barUpdateData(counterList);
}

function barUpdateData(counterList)
{
    for (counter in counterList)
    {
        var machine = counterList[counter]['machine'];
        var index = counterList[counter]['index'];
        var name = counterList[counter]['name'];
        (function(name){
            $.post("http://" + machine + "/api/cli", {
                command: "counter.valuei " + index
            }, function(data){
                chart.load({
                    rows: [
                    [name],
                    [data]
                    ],
                });
            }
            );
        })(name);
    }
    setTimeout(function () {
        barUpdateData(counterList);
    }, interval * 1000);
}




function realtimeDisplay(){
    var basedata = [
        ['x', '1', '2', '3','4','5','6','7','8','9','10', '11', '12', '13','14','15','16','17','18','19'],
    ];
    
    var counterList = JSON.parse(getParameterByName('counterList'));
    var tabledata=[]
    for (counter in counterList)
    {
        var name = counterList[counter]['name'];
        basedata.push([name,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
    }

    chart = c3.generate({
        data: {
            x: 'x',
            columns:basedata
        },
        axis: {
            x: {
                show:false
            }
        }
    });

    realtimeUpdateData(20,counterList);

}

function realtimeUpdateData(a,counterList)
{
    var ajaxcount=0;
    var length = counterList.length;
    var latestdata=[['x', 1]];
    for (counter in counterList)
    {
        var machine = counterList[counter]['machine'];
        var index = counterList[counter]['index'];
        var name = counterList[counter]['name'];
        (function(name){
            $.post("http://" + machine + "/api/cli", {
                command: "counter." + graphtype + "i " + index
            }, function(data){
                latestdata=[['x', a],[name,data]];
                chart.flow({
                    columns: latestdata,
                    duration:1000,
                });
            });
        })(name);
    }

    setTimeout(function () {
        realtimeUpdateData(a+1, counterList);
    }, interval*1000);
}

    

