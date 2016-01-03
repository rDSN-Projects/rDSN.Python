$(function () {
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

        var checkedItems = {}, counter = 0;
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
    
    $('#get-checked-data').on('click', function(event) {
        event.preventDefault(); 
        $("#check-list-box li.active").each(function(idx, li) {
            checkedItems[counter] = $(li).text();
            counter++;
        });
        $('#display-json').html(JSON.stringify(checkedItems, null, '\t'));
    });
});

$(function () {
    $('.list-group.remove-list-box .list-group-item').each(function () {
        
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
                    icon: 'glyphicon glyphicon-remove'
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

            // Set the button's state
            if (isChecked)
                $widget.remove();
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

var counterList = [], counterSelected = []
function SaveView() {
    var graphtype = $('input[name=graphtype]:checked').val();
    if (graphtype==undefined)
    {
        $('result-saveview').html("Error: No graph type chosen");
        return;
    }
    var interval = $('input[name=interval-num]').val();
    if (interval=='')
    {
        interval = $('input[name=interval]:checked').val();
        if (interval==undefined && graphtype!= 'bar')
        {
            $('result-saveview').html("Error: No update interval chosen");
            return;
        }
    }
    var description = $('textarea#description').val();

    if ($("#viewname").val()=="")
    {
        $('result-saveview').html("Error: View name must be specified");
        return;
    }
    //var interval = ""
    $.post("/api/view/save", {
            name: $("#viewname").val(),
            author: $("#author").val(),
            counterList: JSON.stringify(counterList),
            description: description,
            graphtype: graphtype,
            interval: interval,
        }, function(result){
            $('result-saveview').html(result);
        }
    );
};

var viewList = {}
function LoadView() {
    $.post("/api/view/load", {
        }, function(data){
            var tableHTML = ""; 

            var message = JSON.parse(data);
	        for (var i = 0; i < message.length; i++) {
                tableHTML = tableHTML + '<tr id=' + message[i].name + '>' 
                + '<td>' + message[i].name + '</td>' 
                + '<td>' + message[i].description + '</td>'
                + '<td>' + message[i].author + '</td>'
                + '<td><span class="glyphicon glyphicon-play" onclick="PlayView(\'' + message[i].name + '\');"></span></td>'
                + '<td><span class="glyphicon glyphicon-import" onclick="ImportView(\'' + message[i].name + '\');"></span></td>'
                + '<td><span class="glyphicon glyphicon-remove" onclick="DelView(\'' + message[i].name + '\');"></span></td>'
                + '</tr>';
                viewList[message[i].name] = {counterList:message[i].counterList,graphtype:message[i].graphtype,interval:message[i].interval};
                
            }
            $("#viewList tbody > tr").empty();
            $("#viewList tbody").append(tableHTML);
            $('#viewlist').modal('show');
        }
    );
};

function DelView(name) {
    $.post("/api/view/del", {
        name:name
        }, function(data){
            if (data == 'success')
            {
                $('#viewList tr#'+name).remove();
                delete viewList[name];
            }
        }
    );
};

var counterAll;
function AddMachine(){
    $("#machinelist").append('<li class="list-group-item machine" id="newmachineli"><input type="text" id="newmachinetext"></li>');
    $("#newmachinetext").focusout(function() {
        var machinename = $("#newmachinetext").val();
        if (machinename==''){machinename='unknown';}
        $("#newmachineli").remove();
        $("#machinelist").append('<li class="list-group-item machine" id="' + machinename.replace(':','_') +'"><a onClick="Machine2App(\'' + machinename + '\');">' + machinename + '</a><span class="glyphicon glyphicon-remove pull-right" aria-hidden="true" onclick="$(\'#' + machinename.replace(':','_') +'\').remove();"></span></li>');
    });
}

function Machine2App(machine) {
    $.post("http://" + machine + "/api/cli", {
        command: "counter.list"
        }, function(data){
            var message = JSON.parse(data);
            counterAll = message;
            $(".list-group-item.app").remove();
            for (app in message) {
                $("#appList").append('<li class="list-group-item app"><a onClick="App2Section(\'' + machine + '\',\'' + app + '\');">' + app + '</a></li>');
            }
        }
    );
};

function App2Section(machine, app) {
    $(".list-group-item.section").remove();
    for (section in counterAll[app]) {
        $("#sectionList").append('<li class="list-group-item section"><a onClick="Section2Counter(\'' + machine + '\',\'' + app + '\',\'' + section + '\');">' + section + '</a></li>');
    }
};

function Section2Counter(machine, app, section) {
    $(".list-group-item.counter").remove();
    for (counter in counterAll[app][section]) {
        $("#counterList").append('<li class="list-group-item counter"><a onClick="Counter2List(\'' + machine + '\',\'' + app + '\',\'' + section + '\',\'' + counterAll[app][section][counter].name + '\',' + counterAll[app][section][counter].index + ');">' + counterAll[app][section][counter].name + '</a></li>');
    }
};

function Counter2List(machine, app, section, counter, index) {
    $(".list-group.remove-list-box").append('<li class="list-group-item" id="' + machine.replace(':','_') + index + '"><span class="glyphicon glyphicon-remove" onclick="$(\'#' + machine.replace(':','_') + index + '\').remove();"></span>' + machine + ' * ' + app + ' * ' + section + ' * ' + counter+ '</li>');
    counterSelected.push({machine: machine, name: machine + ' * ' + app + ' * ' + section + ' * ' + counter, index:index});
};

function List2List() {
    $(".list-group.remove-list-box li").remove();
    for (counter in counterSelected) {
        $("#counterListAll").append('<li class="list-group-item counter-main" id="' +  counterSelected[counter].machine.replace(':','_') + counterSelected[counter].index + '"><a href="#">' + counterSelected[counter].name + '</a> <span class="glyphicon glyphicon-remove pull-right" aria-hidden="true" onclick="$(\'#' + counterSelected[counter].machine.replace(':','_') + counterSelected[counter].index + '\').remove();counterList.splice(counterList.indexOf(' + '{machine:\'' + counterSelected[counter].machine + '\', name:\'' +  counterSelected[counter].name + '\', index:' + counterSelected[counter].index + '}),1)"></span></li>');
        counterList.push({machine: counterSelected[counter].machine, name: counterSelected[counter].name, index: counterSelected[counter].index});
    }
    counterSelected = []
};

function RunPerformanceView() {
    //window.open('view.html?graphtype=bar&counterList=[{"name":%221.0%4010.172.96.42%3A34801.commit(%23%2Fs)%22,"index":2430951489537,"machine":"localhost:8080"},{"name":%221.0%4010.172.96.42%3A34801.decree%23%22,"index":2439541424129,"machine":"localhost:8080"}]');
    var url = "view.html?"

    var graphtype = $('input[name=graphtype]:checked').val();
    if (graphtype==undefined)
    {
        $('result-runview').html("Error: No graph type chosen");
        $('#runviewres').modal('show');
        return;
    }
    url = url + 'graphtype=' + graphtype;

    var interval = $('input[name=interval-num]').val();
    if (graphtype != 'bar')
    {
        if (interval=='')
        {
            interval = $('input[name=interval]:checked').val();
            if (interval==undefined)
            {
                $('result-runview').html("Error: No update interval chosen");
                $('#runviewres').modal('show');
                return;
            }
        }
        url = url + '&interval=' + interval;
    }
    url = url + '&counterList=' + encodeURIComponent(JSON.stringify(counterList));
    
    window.open(url);
};



function ImportView(viewname) {
    $(".list-group-item.counter-main").remove();
    counterList=[]

    var list = JSON.parse(viewList[viewname].counterList)
    for (counter in list) {
        var counterData = list[counter];
        $("#counterListAll").append('<li class="list-group-item counter-main" id="' + counterData.machine.replace(':','_') + counterData.index + '"><a href="#">' + counterData.name + '</a> <span class="glyphicon glyphicon-remove pull-right" aria-hidden="true" onclick="$(\'#' + counterData.machine.replace(':','_') + counterData.index + '\').remove();counterList.splice(counterList.indexOf(' + '{machine:\'' + counterData.machine + '\', name:\'' + counterData.name + '\', index:' + counterData.index + '}),1)"></span></li>');
        counterList.push({machine: counterData.machine, name: counterData.name, index: counterData.index});
    }
    $('input[name=graphtype][value=' + viewList[viewname].graphtype + ']').attr('checked', 'checked');

    var interval = viewList[viewname].interval;
    if (interval != undefined)
    {
        if (interval == 1 || interval == 5 || interval == 10 )
        {
            $('input[name=interval][value=' + interval + ']').attr('checked', 'checked');
        }
        else
        {
            $('input[name=interval-num]').val(interval);
        }
    }
}

function PlayView(viewname) {

    var url = "view.html?"

    var graphtype = viewList[viewname].graphtype;
    if (graphtype==undefined)
    {
        $('result-runview').html("Error: No graph type chosen");
        $('#runviewres').modal('show');
        return;
    }
    url = url + 'graphtype=' + graphtype;

    var interval = viewList[viewname].interval;
    if (graphtype != 'bar')
    {
        if (interval=='')
        {
            interval = $('input[name=interval]:checked').val();
            if (interval==undefined)
            {
                $('result-runview').html("Error: No update interval chosen");
                $('#runviewres').modal('show');
                return;
            }
        }
        url = url + '&interval=' + interval;
    }
    url = url + '&counterList=' + encodeURIComponent(viewList[viewname].counterList);
    
    window.open(url);

}

