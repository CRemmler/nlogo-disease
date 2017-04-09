var socket;
var oliver;

jQuery(document).ready(function() {
  var userId;
  var userType;
  var turtleDict = {};
  socket = io();

  // show first screen, ask user to enter room
  Interface.showLogin();

  // save student settings
  socket.on("save settings", function(data) {
    userId = data.userId; 
    userType = data.userType; 
  });
  
  // display teacher or student interface
  socket.on("display interface", function(data) {
    userType === "teacher" ? Interface.showTeacher() : Interface.showStudent();
  });
  
  // student repaints most recent changes to world
  socket.on("send update", function(data) {
    oliver.applyUpdate({turtles: data.turtles});
    oliver.repaint();
  });  

  // teacher updates turtle variables
  socket.on("send update turtles", function(data) {
    for (var key in data.turtles) {
      updateTurtle(data.turtles[key]);
    }
  });
  
  // update each variable, for one turtle
  function updateTurtle(oneTurtle) {
    var turtleId = oneTurtle.who;
    if (turtleId != undefined) {
      for (var key in oneTurtle) {
        if (key != "who") {
          world.turtleManager.getTurtle(turtleId).setVariable(key, oneTurtle[key]);
        }
      }
    }
  }
  
  // netlogo colors = ["white", "brown", "green", "yellow", "(violet + 1)", "(sky + 1)"];
  var colorNames = ["white", "brown", "green", "yellow", "purple", "blue"];
  var colorValues = [9.9, 35, 55, 45, 116, 96];
  
  // student updates reporters
  socket.on("send update reporters", function(data) {
    var turtle = data.turtle;
    if (turtle.infected != undefined) { $("#infected").html("" + turtle.infected); }
    if (turtle.xcor) { $("#xcor").html(turtle.xcor); }
    if (turtle.ycor) { $("#ycor").html(turtle.ycor); }
    if (turtle.color) {
      var colorIndex = colorValues.indexOf(turtle.color);
      $("#color").html(colorNames[colorIndex]); 
    }
    if (turtle.shape) { $("#shape").html(turtle.shape); }
  });
  
  // teacher runs setup
  socket.on("setup teacher", function() {
    var command = "setup";
    session.widgetController.ractive.findComponent('console').fire('run', command);
  });

  // teacher runs create-new-student
  socket.on("setup student", function(data) {
    var userId = data.userId;
    var command = "create-students 1 [" + 
      ' set userid "' + userId + 
      '" setup-student-vars ]';
    session.widgetController.ractive.findComponent('console').fire('run', command);
    socket.emit("update all", {userId: data.userId});
  });
  
  // teacher gives student a new appearance
  socket.on("send appearance", function(data) {
    command = 'ask student ' + data.turtleId + 
      ' [' +
        ' set used-shape-colors remove my-code used-shape-colors ' +
        ' set-unique-shape-and-color ' +
        ' if infected ' +
        ' [ set-sick-shape ] ' +
      ']';
    session.widgetController.ractive.findComponent('console').fire('run', command);
  });
  
  // student leaves activity and sees login page
  socket.on("teacher disconnect", function(data) {
    Interface.showLogin();
  });
  
  // remove student
  socket.on("student disconnect", function(data) {
    var command = 'ask turtle '+data.turtleId +
      ' [ die ' + 
      ' set used-shape-colors remove my-code used-shape-colors ' +
    ']';
    session.widgetController.ractive.findComponent('console').fire('run', command);
  });
  
});
