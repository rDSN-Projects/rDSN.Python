
function AutoFill() {
    if ($('#packname').val() == '')
    {
        $('#packname').val(document.forms["fileForm"]["fileToUpload"].value.replace(/^.*[\\\/]/, '').slice(0, -3));
    }
}

function validateForm() {
    var fileToUpload = document.forms["fileForm"]["fileToUpload"].value;
    if (fileToUpload == null || fileToUpload == "") {
        alert("You must choose a file to upload");
        return false;
    }


    var file_name = $('#packname').val();
    if (file_name == null || file_name == "") {
        document.forms["fileForm"]["file_name"].value = fileToUpload.replace(/^.*[\\\/]/, '').slice(0, -3);
    }
    else
    {
        document.forms["fileForm"]["file_name"].value = $('#packname').val();
    }

    
    document.forms["fileForm"]["author"].value = $('#author').val();
    document.forms["fileForm"]["description"].value = $('#description').val();
    document.forms["fileForm"]["schema_info"].value = $('#schema_info_in').val();
    document.forms["fileForm"]["schema_type"].value = $('#schema_type_in').val();
    document.forms["fileForm"]["server_type"].value = $('#server_type_in').val();

    var param_table = document.getElementById('param_input_list');
    var row_len = param_table.rows.length;
    var params_map = {};
    for (i = 1; i < row_len; i++)
    {
        var cells = param_table.rows.item(i).cells;
        var key= cells.item(0).lastElementChild.value;
        var value= cells.item(1).lastElementChild.value;
        if (key != "" && value != "")
        {
            params_map[key] = value;
        }
    }
    document.forms["fileForm"]["parameters"].value = JSON.stringify(params_map);

    return true;
}

loadPackages();

function loadPackageDetail(id) {
    $.post('/api/pack/detail', {id: id
        }, function(data) {
            data = JSON.parse(data);
            $('#detail_app_name').text(data['name']);
            $('#detail_schema_info').text(data['schema_info']);
            $('#detail_schema_type').text(data['schema_type']);
            $('#detail_server_type').text(data['server_type']);
            params = data['parameters'];
            params = JSON.parse(params);
            var tableHTML = "";
            for (var key in params)
            {
                tableHTML += '<tr>'
                          + '<td>' + key + '</td>'
                          + '<td>' + params[key] + ' </td>'
                          + '</tr>';
            }
            $("#detail_parameters tbody tr").remove();
            $("#detail_parameters").append(tableHTML);
        }
    )
}

function loadPackages() {
    $.post("/api/pack/load", {
        }, function(data){
            var tableHTML = ""; 

            var message = JSON.parse(data);
	        for (var i = 0; i < message.length; i++) {
                tableHTML = tableHTML + '<tr id=' + message[i].name + '>' 
                + '<td><img src="local/pack/' + message[i].uuid + '.jpg" width="50" height="50" ></td>' 
                + '<td>' + message[i].name + '</td>' 
                + '<td>' + message[i].author + '</td>'
                + '<td>' + message[i].description + '</td>'
                + '<td><span class="glyphicon glyphicon-file" aria-hidden="true" onclick="window.location.href = \'fileview.html?working_dir=pack/' + message[i].uuid + '&root_dir=local\';"></span></td>'
                + '<td><span class="glyphicon glyphicon-list-alt" aria-hidden="true"' + 'onclick="loadPackageDetail(\'' + message[i].uuid + '\');' + '$(\'#detail_modal\').modal(\'show\');"></span></td>'
                + '<td><span class="glyphicon glyphicon-flash" aria-hidden="true" onclick="window.location.href = \'service.html?package_id=' + message[i].uuid +'\';"></span></td>'
                + '<td><span class="glyphicon glyphicon-send" aria-hidden="true" onclick="SetPackageID(\'' + message[i].uuid + '\');LoadCluster(\'' + encodeURIComponent(JSON.stringify(message[i].cluster_type)) + '\');$(\'#deploypack\').modal(\'show\');"></span></td>'
                + '<td><span class="glyphicon glyphicon-remove" aria-hidden="true" onclick="RemovePackage(\'' + message[i].name + '\');"></span></td>'
                + '</tr>';
                
            }
            $("#packList tbody > tr").empty();
            $("#packList tbody").append(tableHTML);
        }
    )
    .fail(function() {
        alert( "Error: lost connection to the server" );
        return;
    });
}

function RemovePackage(name) {
    $.post("/api/pack/del", { name: name
        }, function(data){ 
           location.reload(false); 
        }
    )
    .fail(function() {
        alert( "Error: lost connection to the server" );
        return;
    });
}

function DeployPackage(name,id,cluster_name) {
    $.post("/api/pack/deploy", { name: name, id: id, cluster_name: cluster_name
        }, function(data){ 
            data = JSON.parse(data);
            if (data['error']=='ERR_OK')
            {
                window.location.href = 'service.html';
            }
            else
            {
                alert("Deploy failed, Error code: " + data['error']);
            }
        }
    )
    .fail(function() {
        alert( "Error: lost connection to the server" );
        return;
    });
}

function SetPackageID(id) {
    $('#package_id_to_deploy').val(id);
}

function LoadCluster(cluster_type_list) {
    req = {"format":""};
    $.post("/api/cli", { 
        command:"server.cluster_list " + JSON.stringify(req)
        }, function(data){
            if(~data.indexOf('unknown command'))
            {
                alert('Error: unknown command cluster_list');
                return;
            } 
            data = JSON.parse(data)['clusters'];
            result = "";
            for(var cluster in data)
            {
                var clusterDisplay = data[cluster]['name'] + '(' + data[cluster]['type'] + ')';
                result += '<li ';
                var if_allowed = (cluster_type_list.indexOf(data[cluster]['type']) == -1);
                if (if_allowed)
                {
                    result += 'class="disabled"';
                }
                result += '><a href="#" ';
                if (!if_allowed)
                {
                    result += 'onclick="$(\'#clusterchoice\').text(\'' + clusterDisplay + '\');$(\'#cluster_name_to_deploy\').val(\'' + data[cluster]['name'] + '\');"'
                }
                result += '>' + clusterDisplay + '</a></li>' ;
            }
            $('#cluster_list ul > li').empty();
            $('#cluster_list ul').append(result);
            
        }
    )
    .fail(function() {
        alert( "Error: lost connection to the server" );
        return;
    });
}

document.getElementById("iconToUpload").onchange = function () {
    document.getElementById("iconpath").value = this.value.replace(/^.*[\\\/]/, '');
};

document.getElementById("fileToUpload").onchange = function () {
    AutoFill();
    document.getElementById("filepath").value = this.value.replace(/^.*[\\\/]/, '');
};

document.getElementById("add_param_btn").onclick = function () {
    var tableHTML = '<tr>'
                  + '<td> <input> </td>'
                  + '<td> <input> </td>'
                  + '<td> <span class="glyphicon glyphicon-remove rm_param_icon" aria-hidden="true"></span></td>'
                  + '</tr>';
    $("#param_input_list").append(tableHTML);
};


//check-box-list
$(function () {
    $('#param_input_list')
        .on('click', '.rm_param_icon', function () {
            $(this).closest("tr").remove();

    });

    $('.list-group.checked-list-box .list-group-item').each(function () {
        // Settings
        var $widget = $(this),
        $checkbox = $('<input type="checkbox" class="hidden" />'),
        color = ($widget.data('color') ? $widget.data('color') : "primary"),
        style = ($widget.data('style') == "button" ? "btn-" : "list-group-item-"),
        settings = {
            on: {
                icon: 'glyphicon glyphicon-check'
            },
        off: {
            icon: 'glyphicon glyphicon-unchecked'
        }
        };

    $widget.css('cursor', 'pointer')
        $widget.append($checkbox);

    // Event Handlers
    $widget.on('click', function () {
        $checkbox.prop('checked', !$checkbox.is(':checked'));
        $checkbox.triggerHandler('change');
        updateDisplay();
    });

    $checkbox.on('change', function () {
        updateDisplay();
    });


    // Actions
    function updateDisplay() {
        var isChecked = $checkbox.is(':checked');

        // Set the button's state
        $widget.data('state', (isChecked) ? "on" : "off");

        // Set the button's icon
        $widget.find('.state-icon')
            .removeClass()
            .addClass('state-icon ' + settings[$widget.data('state')].icon);

        // Update the button's color
        if (isChecked) {
            $widget.addClass(style + color + ' active');
        } else {
            $widget.removeClass(style + color + ' active');
        }
    }

    // Initialization
    function init() {

        if ($widget.data('checked') == true) {
            $checkbox.prop('checked', !$checkbox.is(':checked'));
        }

        updateDisplay();

        // Inject the icon if applicable
        if ($widget.find('.state-icon').length == 0) {
            $widget.prepend('<span class="state-icon ' + settings[$widget.data('state')].icon + '"></span>');
        }
    }
    init();
    });
});


function getClusterType(){
    var clusterTypeList = [];
    $("#check-list-box li.active").each(function(idx, li) {
            clusterTypeList.push($(li).attr('index'));
        });
    document.forms["fileForm"]["cluster_type"].value = JSON.stringify(clusterTypeList);
    
}
