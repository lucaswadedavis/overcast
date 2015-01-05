$(document).ready(function(){
    app.c.init();
});

///////////////////////////////////////////////////////
///////////////////////////////////////////////////////

var app={};
app.m={};
app.v={};
app.c={};
app.t={};

///////////////////////////////////////////////////////
///////////////////////////////////////////////////////

app.m.bounds=false;
app.m.paper=false;
app.m.dateOffset=0;
app.m.wundergroundKey="b94e6eee03d555d6";
app.m.stateDigraph="CA";
app.m.city="San_Francisco";
app.m.weatherData=false;
app.m.solarData=false;
app.m.globalAnimationLock=false;
app.m.selectedDate=new Date();
app.m.appName="Overcast";

///////////////////////////////////////////////////////
///////////////////////////////////////////////////////begin controllers

app.c.init=function(){
  app.c.getWeatherData();
  app.v.init();  
  app.v.listeners();
};


app.c.getSolarData=function(){
  var url="http://api.wunderground.com/api/";
  url+=app.m.wundergroundKey+"/";
  //url+="hourly/q/";
  url+="astronomy/q/";
  //url+="geolookup/conditions/q/";
  url+=app.m.stateDigraph+"/"+app.m.city+".json";
  
  $.ajax({
    url:url,
    dataType : "jsonp",
    success : function(parsed_json) {
      //fix later - just for testing
      app.m.solarData=parsed_json;
      //app.v.drawGraph();
      }
  });

};


app.c.getWeatherData=function(){
  var url="http://api.wunderground.com/api/";
  url+=app.m.wundergroundKey+"/";
  url+="hourly/q/";
  //url+="geolookup/conditions/q/";
  url+=app.m.stateDigraph+"/"+app.m.city+".json";
  
  $.ajax({
    url:url,
    dataType : "jsonp",
    success : function(parsed_json) {
      //fix later - just for testing
      app.m.weatherData=parsed_json;
      app.v.drawGraph();
      }
  });

};

///////////////////////////////////////////////////////end controllers
///////////////////////////////////////////////////////begin views

app.v.init=function(){
    //app.m.bounds=app.v.initBounds();
    zi.css();
    $("body").html(app.t.layout() );
    app.m.paper=app.v.initPaper();
    app.v.initialReveal();
};

app.v.initBounds=function(){
	var w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0],
    x = w.innerWidth || e.clientWidth || g.clientWidth,
    y = w.innerHeight|| e.clientHeight|| g.clientHeight;
  var b={};
  b.right=x-20;
  b.left=0;
  b.top=0;
  b.bottom=y;
  b.centerX=b.right/2;
  b.centerY=b.bottom/2;
  b.width=b.right-b.left;
  b.height=b.bottom-b.top;

  return b;
};


app.v.initialReveal=function(){
  //app.v.drawGraph();
  
};

app.v.drawGraph=function(date){
  var d=date||app.m.selectedDate;
  var chnc = new Chance(d.toDateString() );
  //var chnc=new Chance();
  paper.project.clear();
  var strokeWidth=1;
  var strokeColor="#fff";
  
  var conditions={
    "partly cloudy":1,
    "clear":0
  };
  
  var avg=function(){
    for (var i=0, sum=0;i<arguments.length;i++){
      sum+=arguments[i];
    }
    return sum/arguments.length;
  };
  
  var dist=function(x1,y1,x2,y2){
    var l1=Math.abs(x1-x2);
    var l2=Math.abs(y1-y2);
    return Math.sqrt((l1*l1)+(l2*l2));
  };
  
	var circle=function(x,y,r){
		var path = new paper.Path.Circle({
    	//center: paper.view.center,
    	center:[x,y],
    	radius: r,
    	strokeColor:strokeColor,
    	strokeWidth:strokeWidth
    });
		  
	};
	
	var diamond=function(x,y,l,w1,w2){
    var p=new paper.Path;
    p.strokeColor=strokeColor;
    p.strokeWidth=strokeWidth;
    p.add([x,y]);
    p.add([x+(l/2),y-(l/2)]);
    p.add([x+l,y]);
    p.add([x+(l/2),y+(l/2)]);
    p.add([x,y]);
    return p;
	};
	
	var petal=function(x,y,l,w1,w2){
    var p=new paper.Path;
    var w1=w1||2;
    p.add([x+l,y]);
    p.add(new paper.Segment(
      new paper.Point([x,y]),
      new paper.Point([0,-l/w1]),
      new paper.Point([0,l/w1])
      )
    );
    p.add([x+l,y]);
    p.strokeColor=strokeColor;
    p.strokeWidth=strokeWidth;
    return p;
	};

  var spiro=function(startingPoint,endingPoint,opts){
    var b=paper.view.bounds;
    var p=new paper.Path();
    p.strokeColor="#ffffff";
    var startingPoint=startingPoint || [b.left,b.centerY];
    var endingPoint=endingPoint || [b.centerX,b.centerY];
    
    
    var point=function(x,y){
      p.add(new paper.Point(x,y));
      return p;
    };
  
    
    var x=startingPoint[0];
    var y=startingPoint[1];
    var theta=90;
    var r=300;
    //start with the starting point
    point(x,y);
    debugger;
    //do a loopy thing, checking distance along the way and decreasing the radius
    //this doesn't work...not sure why
    while(dist(x,y,endingPoint[0],endingPoint[1])>10){
      theta-=60;
      r-=5;
      
      var coords=geo.getPoint(x,y,r,theta);
      //console.log(coords);
      x=coords.x2;
      y=coords.y2;
      point(x,y);
    }
    
    //end with the ending point
    point(endingPoint[0],endingPoint[1]);

    //bezier curves, i'll start with one, but i'm going to use paper's smooth()
    //get a useful fraction of the full path;
    /*
    var quantum=Math.abs(startingPoint[0]-endingPoint[0])/3;
    //start with a starting point
    p.add(new paper.Point(startingPoint[0],startingPoint[1]) );
    //curve up toward the anchor
    p.add(new paper.Point(startingPoint[0]+(quantum*2) , startingPoint[1]-(quantum) ) );
    
    //curve beyond the ending point
    p.add(new paper.Point(endingPoint[0]+quantum , endingPoint[1] ) );
    
    //curve opposite the initial curve
    p.add(new paper.Point(endingPoint[0], endingPoint[1]+quantum ) );
    //curve back towared the ending point
    p.add(new paper.Point(endingPoint[0],endingPoint[1]) );
    */
    
    //p.fullySelected=true;
    //p.smooth();
    
    return p;
  };

  var line=function(){
    var p=new paper.Path();
    p.strokeColor=strokeColor;
    p.strokeWidth=strokeWidth;
    var b=paper.view.bounds;
    p.add([b.left,b.centerY]);
    p.add([b.right,b.centerY]);
    
    var hours=24;
    var interval=(b.right-b.left)/(hours+1);
    var weather=app.m.weatherData.hourly_forecast;
    for (var i=0;i<hours;i++){
      var x=interval+(i*interval);
      var y=b.centerY;
      var r=2;
      circle(x,y,r);
      if (weather){
        if (weather[i].condition==="Partly Cloudy"){
          circle(x,y,r+5);
        } else{
          circle(x,y,r+10);
        }
      }
    }
    
    //solar circle
    
    circle(b.centerX,b.centerY,600);
    
    
    return p;
  };

  

  line();
  //the spiro thing's just not a good idea
  //spiro();
  
  //i need some method to remember the locations of the days... or do I?
  
  
  
  //add the weather data to the line
  
	paper.view.draw();
};

app.v.initPaper=function(){
  var canvas = document.getElementById('paper');
  //var chnc = new Chance();
	paper.setup(canvas);
	app.v.drawGraph();
	paper.view.onResize=function(event){
	  app.v.drawGraph();
	  paper.view.draw();
	};
	var mc=new Hammer(document.getElementById('paper'));
	mc.on("panleft panright",function(event){
	  if (!app.m.globalAnimationLock && event.type==="panleft"){
	    app.m.globalAnimationLock=true;
	    setTimeout(function(){app.m.globalAnimationLock=false},100);
	    $("body").trigger("nextDay");
	  }else if (!app.m.globalAnimationLock && event.type==="panright"){
	    app.m.globalAnimationLock=true;
	    setTimeout(function(){app.m.globalAnimationLock=false},100);
	    $("body").trigger("previousDay");
	  }
	});
};

app.v.listeners=function(){
  var changeDate=function(offset){
    app.m.dateOffset=app.m.dateOffset+offset;
    app.m.selectedDate=moment()
      .add(app.m.dateOffset,'d')
      .toDate();
    app.v.drawGraph(app.m.selectedDate);
    
    $("div#dateDisplay").html(moment(app.m.selectedDate).format("dddd, MMMM Do YYYY"));
  };

  $("body").on("nextDay",function(){
    changeDate(1);
  });
  
  $("body").on("previousDay",function(){
    changeDate(-1);
  });


  $("body").keydown(function(){
    var key=event.which;
    //console.log(key);
    if (key==37){
      $("body").trigger("previousDay");
    }else if(key==39){
      $("body").trigger("nextDay");
    }
  });
  

};

///////////////////////////////////////////////////////end views
///////////////////////////////////////////////////////begin templates

app.t.layout=function(){
  var d="";
  d+="<canvas id='paper' data-paper-resize='true' data-paper-keepalive='true'></canvas>";
  d+="<div id='dateDisplay'>"+moment(app.m.selectedDate).format("dddd, MMMM Do YYYY")+"</div>";

  return d;
};

///////////////////////////////////////////////////////end templates
///////////////////////////////////////////////////////begin css

zi={};
zi.config=function(){
    var css={
      "body":{
        "font-family":"sans-serif",
        "padding":"0",
        "margin":"0",
        "border":"0",
        "background":"#555"
      },
      "canvas":{
        "margin":"0",
        "padding":"0",
        "border":"0",
        "position":"fixed"
      },
      "canvas#paper":{
        "z-index":"-1"
      },
      "div#yesterday":{
        "float":"left"
      },
      "div#tomorrow":{
        "float":"right"
      },
      "div#dateDisplay":{
        "padding":"30px",
        "color":"#ddd",
        "position":"fixed",
        "z-index":"0"
      }
    };
    return css;
};
zi.transform=function(css){
    var c="";
    for (var selector in css){
        c+=selector+"{";
        for (var property in css[selector]){
            c+=property+" : "+css[selector][property]+";";
        }
        c+="}";
    }
    return c;
};
zi.css=function(){
    if ($("head#zi").length<1){
        $("head").append("<style type='text/css' id='zi'></style>");
    }
    $("head style#zi").html( this.transform( this.config() ) );
};
/////////////////////////////////////////////////////// end css section
///////////////////////////////////////////////////////