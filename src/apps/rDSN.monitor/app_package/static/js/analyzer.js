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

var counterList = {}
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
        if (interval==undefined)
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
            counterList: counterList,
            description: description,
            graphtype: graphtype,
            interval: interval,
        }, function(result){
            $('result-saveview').html(result);
        }
    );
};

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
                + '<td><span class="glyphicon glyphicon-play"></span></td>'
                + '<td><span class="glyphicon glyphicon-import"></span></td>'
                + '<td><span class="glyphicon glyphicon-remove" onclick="DelView(\'' + message[i].name + '\');"></span></td>'
                + '</tr>';
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
            }
        }
    );
};

function updateCounterList() {
};

var counterAll;

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
        $("#counterList").append('<li class="list-group-item counter"><a onClick="Counter2List(\'' + machine + '\',\'' + app + '\',\'' + section + '\',\'' + counterAll[app][section][counter].name + '\');">' + counterAll[app][section][counter].name + '</a></li>');
    }
};

function Counter2List(machine, app, section, counter) {
    $(".list-group.remove-list-box").append('<li class="list-group-item">' + machine + ' * ' + app + ' * ' + section + ' * ' + counter+ '</li>');
};

function List2List() {
    $(".list-group.remove-list-box li").remove();
    
};
