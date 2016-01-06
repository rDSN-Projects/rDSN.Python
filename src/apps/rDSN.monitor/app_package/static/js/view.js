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

//time operation
function strtoms(str){
        var arr = str.split(":");
        var arr2 = arr[2].split(".");
        return ((Number(arr[0]) * 60 + Number(arr[1])) * 60 + Number(arr2[0])) * 1000 + Number(arr2[1]);
}

function mstostr(milli){
        var hr= ("00" + Math.floor((milli / (60 * 60 * 1000))%100).toString()).substr(-2,2);
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

var latestdata, latesttime;
    var lastdata, lasttime;
    var DataToUpdate;
    var inittime;


function realtimeDisplay(){
    var basedata = [
        ['x', '1', '2', '3','4','5','6','7','8','9','10', '11', '12', '13','14','15','16','17','18','19'],
    ];
    

    var counterList = JSON.parse(getParameterByName('counterList'));
    
    DataToUpdate = [['x', 1]];
    latestdata=[]; latesttime=[];
    lastdata=[]; lasttime=[];
    inittime = 0;

    for (counter in counterList)
    {
        var name = counterList[counter]['name'];
        basedata.push([name,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
        DataToUpdate.push([name, 0]);
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

    $("#realtimeData thead").append("<tr><th>Counter Name</th><th>Counter Value</th><th>rDSN Time</th></tr>");
    for (counter in counterList)
    {
        $("#realtimeData tbody").append("<td>" + counterList[counter]['name'] + "</td><td><span class='counter" + counter + "'></td><td><span class='time" + counter + "'></td>");
    }

    $("#baseTimeData thead").append("<tr><th>Base Time</th></tr>");
    $("#baseTimeData tbody").append("<td><span class='basetime'></td>");

    inittime = (new Date()).getTime();
    realtimeUpdateData(20,counterList);

}

function realtimeUpdateData(a,counterList)
{
    var ajaxcount=0;
    var length = counterList.length;
    
    for (counter in counterList)
    {
        var machine = counterList[counter]['machine'];
        var index = counterList[counter]['index'];
        var name = counterList[counter]['name'];
        
        (function(counter){
            $.post("http://" + machine + "/api/batchcli", {
                commands: JSON.stringify(["pq time","counter." + graphtype + "i " + index])
            }, function(data){
                data = JSON.parse(data);
                $('.counter'+counter).html(data[1]);
                $('.time'+counter).html(data[0]);

                updateRefData(counter,data[0],data[1]);
                
            });
        })(counter);
    }
    if (latesttime[0] != undefined)
    {
        $('.basetime').html(addmstostr(latesttime[0], (new Date()).getTime() - inittime));
    }

    chart.flow({
        columns: DataToUpdate,
        duration:interval*1000,
        done:function(){
            setTimeout(function () {
                //chart.xgrids.add([{value: a, text:time,class:'hoge'}]);
                realtimeUpdateData(a+1, counterList);
            }, 0);}
    });
}

function updateRefData(counter,time,val){
    latestdata[counter]=val;
    latesttime[counter]=time;
}
    

