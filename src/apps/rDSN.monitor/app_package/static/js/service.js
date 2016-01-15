updateTable();

function updateTable()
{
    req = {"package_id":""}
    $.post("/api/cli", { 
        command:"service_list " + JSON.stringify(req)
        }, function(data){ 
            if(~data.indexOf('unknown command'))
            {
                alert('Error: unknown command service_list');
                return;
            } 
            data = JSON.parse(data)['services'];
            result = "";
            
            $("#serviceList tbody > tr").empty();
            for(var service in data)
            {
                result = '<tr id="' + data[service]['name'] + '"><td>' + data[service]['name'] + '</td><td>' + data[service]['package_id'] + '</td><td>' + data[service]['cluster'] + '</td><td>' + data[service]['service_url'] + '</td><td>' + data[service]['status'] + '</td><td>' + data[service]['error'] + '</td><td><span class="glyphicon glyphicon-remove" aria-hidden="true" onclick="undeploy("' + data[service]['name'] + '");"></span></td></tr>';
                $("#serviceList tbody").append(result);
            }
            window.setTimeout(function () {
                updateTable();
            }, 5000);
        }
    )
    .fail(function() {
        alert( "Error: lost connection to the server" );
        return;
    });
}

function undeploy(service_name) {
    $.post("/api/pack/undeploy", { 
        service_name:service_name
        }, function(data){ 
            if(data == 'ok')
            {
                $('#'+service_name).remove();
            }
        }
    )
    .fail(function() {
        alert( "Error: lost connection to the server" );
        return;
    });
}
