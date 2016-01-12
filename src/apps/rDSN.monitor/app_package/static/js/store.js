document.forms["fileForm"]["fileToUpload"].onchange = AutoFill;

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

    return true;
}

loadPackages();

function loadPackages() {
    $.post("/api/pack/load", {
        }, function(data){
            var tableHTML = ""; 

            var message = JSON.parse(data);
	        for (var i = 0; i < message.length; i++) {
                tableHTML = tableHTML + '<tr id=' + message[i].name + '>' 
                + '<td><img src="/app/app_package/local/pack/' + message[i].name + '.jpg" width="50" height="50" ></td>' 
                + '<td>' + message[i].name + '</td>' 
                + '<td>' + message[i].author + '</td>'
                + '<td>' + message[i].description + '</td>'
                + '<td><span class="glyphicon glyphicon-gift" aria-hidden="true" onclick="window.location.href = \'fileview.html?working_dir=app_package/local/pack/' + message[i].name + '\';"></span></td>'
                + '<td><span class="glyphicon glyphicon-flash" aria-hidden="true" onclick=";"></span></td>'
                + '<td><span class="glyphicon glyphicon-send" aria-hidden="true" onclick=";"></span></td>'
                + '<td><span class="glyphicon glyphicon-remove" aria-hidden="true" onclick="RemoveApp(\'' + message[i].name + '\');"></span></td>'
                + '</tr>';
                
            }
            $("#packList tbody > tr").empty();
            $("#packList tbody").append(tableHTML);
        }
    );


}

function RemoveApp(name) {
    $.post("/api/pack/del", { name: name
        }, function(data){ 
            if(data=='success') {
                $('tr[id="'+name+'"]').remove();
            }
        }
    );
}

