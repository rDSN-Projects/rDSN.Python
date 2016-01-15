function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}


$(".viewname").html(getParameterByName('viewname'));

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

var counterList; 

var chart;

var latestdata, latesttime;

$("#realtimeData thead").append("<tr><th>Counter Name</th><th>Counter Value</th><th>Local Time</th></tr>");
for (counter in counterList)
{
    $("#realtimeData tbody").append("<tr><td>" + counterList[counter]['name'] + "</td><td><span class='counter" + counter + "'></td><td><span class='time" + counter + "'></td></tr>");
}

$("#baseTimeData thead").append("<tr><th>Base Time</th></tr>");
$("#baseTimeData tbody").append("<tr><td><span class='basetime'></td></tr><tr><td>The data is not linearized!</td></tr>");

//bar graph
function barDisplay(){
    chart = c3.generate({
            /*size: {
              height: 720,
              },*/
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
                },
                y:{
                    //label: 'queue length',
                    tick: {
                        format: d3.format(",")
                    }
                }
            }
        });
    counterList = JSON.parse(getParameterByName('counterList'));
    latestdata=[]; latesttime=[];
    
    for (counter in counterList)
    {
        latestdata[counter]=0;
        latesttime[counter]=0;
        barUpdateData(counter);
    }
    barUpdateGraph();
}

function barUpdateData(counter)
{
    var machine = counterList[counter]['machine'];
    var index = counterList[counter]['index'];
    var name = counterList[counter]['name'];
    (function(counter){
        $.post("http://" + machine + "/api/cli", {
            command: "counter.valuei " + index
        }, function(data){
            try {
                data = JSON.parse(data);
            }
            catch(err) {
                data = {'val':'Invalid Data','time':'Invalid Data'};
            }
            latestdata[counter]=data['val'];
            latesttime[counter]=data['time'];
            setTimeout(function () {
                barUpdateData(counter);
            }, interval * 1000);
        }
        );
    })(counter);
}

function barUpdateGraph()
{
    for (counter in counterList)
    {
        var name = counterList[counter]['name'];
        $('.counter'+counter).html(latestdata[counter]);
        $('.time'+counter).html(nstostr(latesttime[counter]));
        chart.load({
            rows: [
            [name],
            [latestdata[counter]]
            ],
        });
    }

    if (latesttime[0] != undefined)
    {
        //$('.basetime').html(addmstostr(latesttime[0], (new Date()).getTime() - inittime));
        $('.basetime').html(nstostr(latesttime[0]));
    }

    setTimeout(function () {
        barUpdateGraph();
    }, interval * 1000);
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

    var lastdata, lasttime;
    var DataToUpdate;
    var inittime;


function realtimeDisplay(){
    var basedata = [
        ['x', '1', '2', '3','4','5','6','7','8','9','10', '11', '12', '13','14','15','16','17','18','19'],
    ];
    

    counterList = JSON.parse(getParameterByName('counterList'));
    
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

    inittime = (new Date()).getTime();
    for (counter in counterList)
    {
        realtimeUpdateData(counter);
    }
    realtimeUpdateGraph(20);
}
function realtimeUpdateGraph(a)
{
    chart.flow({
        columns: DataToUpdate,
        duration:interval*1000,
        done:function(){
            setTimeout(function () {
                chart.xgrids.add([{value: a, text:latesttime[0],class:'hoge'}]);
                realtimeUpdateGraph(a+1);
            }, 0);}
    });

    for (counter in counterList)
    {
        $('.counter'+counter).html(latestdata[counter]);
        $('.time'+counter).html(latesttime[counter]);
    }
    if (latesttime[0] != undefined)
    {
        //$('.basetime').html(addmstostr(latesttime[0], (new Date()).getTime() - inittime));
        $('.basetime').html(latesttime[0]);
    }
}

function realtimeUpdateData(counter)
{
    
    var machine = counterList[counter]['machine'];
    var index = counterList[counter]['index'];
    var name = counterList[counter]['name'];
    
    (function(counter){
        $.post("http://" + machine + "/api/cli", {
            command: "counter." + graphtype + "i " + index
        }, function(data){
            try {
                data = JSON.parse(data);
            }
            catch(err) {
                data = {'val':'Invalid Data','time':'Invalid Data'};
            }
            updateRefData(counter,nstostr(data['time']),data['val']);
            setTimeout(function () {
                realtimeUpdateData(counter);
            }, interval*1000);
        });
    })(counter);
}

function updateRefData(counter,time,val){
    latestdata[counter]=val;
    latesttime[counter]=time;
    DataToUpdate[Number(counter)+1][1]=val;
}
    

