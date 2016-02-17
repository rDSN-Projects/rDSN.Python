var machineList = [];

function SendReqAll() {
    document.getElementById("jsontable").innerHTML = "";
    for (machineNum in machineList)
    {
        SendReqSingle(machineList[machineNum]);
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


function AddMachine() {
    if($("#newmachinetext").length) {return;}
    $('<li class="list-group-item machine" id="newmachineli"><input type="text" id="newmachinetext"></li>').insertBefore("#addmachinebut");
    $("#newmachinetext").change(function() {
        var machinename = $("#newmachinetext").val();
        if (machinename==''){machinename='unknown';}
        $("#newmachineli").remove();
        var newMachine = '<li class="list-group-item machine" id="' + machinename.replace(':','_') +'"><a onClick="Machine2App(\'' + machinename + '\');$(\'.\'+$(this).parent().attr(\'class\').replace(\' \',\'.\')).css(\'background\',\'white\');$(this).parent().css(\'background\',\'#99ffcc\');">' + machinename + '</a><span class="glyphicon glyphicon-remove pull-right" aria-hidden="true" onclick="$(\'#' + machinename.replace(':','_') +'\').remove();"></span></li>';
        $(newMachine).insertBefore("#addmachinebut");

        machineList.push(machinename);
    });
}


