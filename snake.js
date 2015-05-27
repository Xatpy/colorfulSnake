$(document).on('ready', function() {
  	// $('#snake').width(document.body.clientWidth);
  	// $('#snake').height(document.body.clientHeight);

	var canvas = $("#snake")[0];
	var context = canvas.getContext("2d");
 
	//Obtenemos el ancho y alto de nuestro canvas.
	var width = $("#snake").width();
	var height = $("#snake").height();

	var varScreen = true;

	var numCellsWidth, numCellsHeight;

	var state = "playing";
	var pause = false;

	//Global variables
	var cellWidth = 25;  // it has to be dynamic
	var d; 		//direction
	var old_direction;
	
	var food;
	var listFood = [];
	var numFood = 10;

	var score;
	//var level = 5; //Speed level
	var levelDefault = 5;
	var level = levelDefault;
	var background = 'white';
	var border = 'black';
	var snakeColor = 'black';

	var snake;

	var textGameOver = [];
	var textPause = [];

	var record = -1;

	var is_touch_device = false;
	var sigCanvas;

	var vibration = false;

	//Flashing so you're invincible
	var invincible = true;
	var foodEatenTimeStamp = 0; //We store  the timestamp when we eat correct food
	var rangeMSInvincible = 1000; //ms
	var timeStampInvincible = 0; //Timestamp invincibility

	//Intro flashing explanation
	var rangeIntro = 3000; //3 seconds to learn
	var timeStampIntro = 0;
	var intro = true;

	init();

	function init()
	{
		initialSettings();

		initListeners();

		numCellsWidth = Math.floor(width / cellWidth);
		numCellsHeight = Math.ceil(height / cellWidth);

		generateTextGameOver();
		generateTextPause();

		resetGame();
		timeStampIntro = Date.now();//It isn't inside resetGame because it's only shown the firtst time

		checkRecord(0);

	}

	function resetGame() {
		d = "right";
		old_direction = undefined;

		createSnake();
		//createFood();
		createRandomListFood();
		score = 0;
		if (typeof gameLoop != "undefined") {
			clearInterval(gameLoop);
		}
		 
		//game speed
		gameLoop = setInterval(update, 1000 / levelDefault);
	}
 
 	function initialSettings() {
 		if (varScreen) {
 			//adaptar el tamaño del cuadrado al movil

	 		//alert('width:' + document.body.clientWidth + '   : height:' + document.body.clientHeight);
	 		var sizeCanvas = (document.body.clientHeight <= document.body.clientWidth ? document.body.clientHeight : document.body.clientWidth);

	 		//size -= 200;
	 		//size -= (size / 10) * 4 ;

	 		var space = 40;
			var canvas = document.getElementById('snake');
			debugger
			sizeCanvas -= (space * 2)
			canvas.width = canvas.height = sizeCanvas;//
			
			//Global variables about width and height, used before
			width = height = sizeCanvas;

			// I'm going to calculate the cellWidth depending on width. 
			// I have to have, at least 25 cells.
			cellWidth = Math.floor(sizeCanvas / 25);

			//Then, I'm going to calculate the dimensions of header and record
			var sizeWindow = $(document).height();
			var dif = sizeWindow - sizeCanvas;

			//I have dif to share between record and head
			var margin = dif / 8;
			$('#head').css({"margin": margin + "px"});
			$('#record').css({"height":"12px", "margin-top": margin + "px",
							  "margin-bottom":"1px"});

		}
 	}

	function initListeners() {
         is_touch_device = 'ontouchstart' in document.documentElement;
         //alert('is_touch_device ' + is_touch_device);

        // attach the touchstart, touchmove, touchend event listeners.
        canvas.addEventListener('touchstart', touchInput, false);
        canvas.addEventListener('touchmove', touchInput, false);
        canvas.addEventListener('touchend', touchInput, false);

        // prevent elastic scrolling
        canvas.addEventListener('touchmove', function (event) {
           event.preventDefault();
        }, false); 
	}

    function touchInput(event) {
		console.log('aqui stoy y la d es: ' + d);
		if (d === "") {
			console.log('kepasaaki');
			d = 'down';
		}
		currentTimeStamp = Date.now();
		if (currentTimeStamp > lastTimeStamp + rangeMS) {
			lastTimeStamp = currentTimeStamp;

	       // get the touch coordinates.  Using the first touch in case of multi-touch
	       if (!event || event.targetTouches > 0 || event.targetTouches[0] === undefined ) {
	       	console.log('fuera');
	       	//alert('fuera');
	       	return;
	       }


	       if (state === "gameOver") {
        		d = "enter";
        		return;
        	}

	       var coors = {
	          x: event.targetTouches[0].pageX,
	          y: event.targetTouches[0].pageY
	       };

        	var position = getPosition(event.targetTouches[0]);
	        d = checkQuadrant(position);
	        console.log(d);
	    } 
	    else {console.log('pesao');}
    }

    //Creating snake
	function createSnake()
	{
		var length = 5;
		snake = [];
 
 		/*
		for(var i = length - 1; i >= 0; i--)
		{
			snake.push({ x: i, y: 0 });
		}
		*/


		//Random position in hte first half, because the snake always goes to the right
		var randomPositionX = Math.floor((Math.random() *  (numCellsWidth / 2) ));
		var randomPositionY = Math.floor((Math.random() * 10) );
 
		for(var i = (length + randomPositionX) - 1; i >= randomPositionX; i--)
		{
			snake.push({ x: i, y: randomPositionY });
		}
	}

	//Reference: http://stackoverflow.com/questions/1152024/best-way-to-generate-a-random-color-in-javascript
	function createRandomColor() {
		return '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6);
	}

	//Creating food RANDOMLY
	function createFood()
	{
		food = {
				x: Math.round(Math.random() * (width - cellWidth) / cellWidth),
				y: Math.round(Math.random() * (height - cellWidth) / cellWidth),
			};
		snakeColor = createRandomColor();
	}


	function existColor(color) {
		var range = 1000000;

		for (var i = 0; i < listFood.length; ++i) {
			var numA = parseInt(listFood[i].color.slice(1,7),16);
			var numB = parseInt(color.slice(1,7),16);
			var rest = Math.abs(numA - numB);

			if (rest < range) {
				return true;
			}
		}
		return false;
	}

	function checkPosition(posRnd) {
		var snakeLength = snake.length;
		for (var i = 0; i < snakeLength; ++i) {
			if ( (snake[i].x === posRnd.x) && (snake[i].y === posRnd.y) ) {
				return true;
			}
		}
		return false;
	}

	function createRandomPosition() {
		var pos = {};
		pos.x = Math.round(Math.random() * (width - cellWidth) / cellWidth);
		pos.y = Math.round(Math.random() * (height - cellWidth) / cellWidth);
		return pos;
	}

	function createRandomListFood() {
		listFood = [];
		var colorSnk;
		for (var i = 0; i < numFood; ++i) {
			var colorRnd = createRandomColor();
			// Check color
			while (existColor(colorRnd)) {
				colorRnd = createRandomColor();
			}
			// Check position
			var posRnd = createRandomPosition();
			while (checkPosition(posRnd)) {
				posRnd = createRandomPosition();
			}

			listFood.push ( {
				x: 		posRnd.x,
				y: 		posRnd.y,
				color: 	colorRnd
			});

			if (i === 0) {
				snakeColor = colorRnd;
			}
		}// for 
	}

	//Returns:  0 if it has no eaten. 
	//          1 if it has eaten the correct color
	//         -1 incorrect color
	function hasEatenFood(nx, ny) {
		//We check te food if we aren't invincible
		if (!invincible) {
			for (var i = 0; i < numFood; i++) {
				if ( (nx === listFood[i].x) && (ny === listFood[i].y) ) {
					if (listFood[i].color === snakeColor) {
						return 1
					} else {
						return -1;
					}
				}
			}
		}
		return 0;
	}

      // works out the X, Y position of the click inside the canvas from the X, Y position on the page
	function getPosition(mouseEvent, sigCanvas) {
		var x_, y_;
		if (mouseEvent.pageX != undefined && mouseEvent.pageY != undefined) {
			x_ = mouseEvent.pageX;
			y_ = mouseEvent.pageY;
		} else {
			x_ = mouseEvent.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			y_ = mouseEvent.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}

		return { x: x_ - canvas.offsetLeft, y: y_ - canvas.offsetTop };
	}
    
    function checkQuadrant(position) {
    	// el punto de la posición donde se ha pulsado en el canvas
    	//var P = [position.X, position.Y];
    	var P = [position.x, position.y];
    	//Voy a comprobar en qué cuadrante ha dado y lo guardo en la variable result.
    	var dir = "";
    	var centro = [(width / 2), (height / 2)];
    	//Compruebo el cuadrante de la izquierda ||| (0,0) | (heigh,0) | (width/2,height/2)
    	var A = [0,0];
    	var B = [0,height];
    	var C = centro;
    	//Also, we check that we aren't going to the opposite direction (logic problem)
    	if (pointInTriange(P,A,B,C)) {
    		if (d !== "right")
    			dir = "left"; 
    		else
    			dir = "right";
    	} else {
    		//Compruebo en el cuadrante de arriba ||| (0,0) | (centro) | (width, 0)
    		A = [0,0];
    		B = [width, 0];
    		C = centro;
    		if (pointInTriange(P,A,B,C) ) {
    			if (d !== "down") 
    				dir = "up"; 
    			else
    				dir = "down";
    		} else {
    			//Derecha
    			A = [width, 0];
    			B = centro;
    			C = [width, height];
    			if (pointInTriange(P,A,B,C)) {
    				if (d !== "left")
    					dir = "right";
    				else
    					dir = "left";
    			} else {
    				//Abajo
    				A = [width, height];
    				B = centro;
    				C = [0, height];
    				if (pointInTriange(P,A,B,C)) {
    					if (d !== "up")
    						dir = "down";
    					else
    						dir = "up";
    				}
    			}
    		}
    	}

    	return dir;
    }

    function pointInTriange(P, A, B, C) {
		// Compute vectors        
		function vec(from, to) {  
		return [to[0] - from[0], to[1] - from[1]];  
		}

		// Compute dot products
		function dot(u, v) {  
		return u[0] * v[0] + u[1] * v[1];  
		}

		var v0 = vec(A, C);
		var v1 = vec(A, B);
		var v2 = vec(A, P);

		var dot00 = dot(v0, v0);
		var dot01 = dot(v0, v1);
		var dot02 = dot(v0, v2);
		var dot11 = dot(v1, v1);
		var dot12 = dot(v1, v2);
		// Compute barycentric coordinates
		var invDenom = 1.0 / (dot00 * dot11 - dot01 * dot01);
		var u = (dot11 * dot02 - dot01 * dot12) * invDenom;
		var v = (dot00 * dot12 - dot01 * dot02) * invDenom;
		// Check if point is in triangle
		return (u >= 0) && (v >= 0) && (u + v < 1);
    }

	function input() {
		sigCanvas = document.getElementById("canvasSignature");
	}

	$("#snake").mousedown(function (mouseEvent) {

		if (!is_touch_device) {
			debugger
			if (state === "gameOver") {
        		d = "enter";
        		return;
        	}
			console.log('clickkkkkkkkk');
        	var position = getPosition(mouseEvent, sigCanvas);
        	d = checkQuadrant(position);
		}
        
    });

	function update() {
		input();
		if (state === "playing") {
			play();
		} else if (state === "pause") {
			pauseState();
		} else if (state === "gameOver") {
			gameOver();
		}
		paint();
	}

	function pauseState() {
		if (d === "enter") {
			state = "playing";
			resetGame();
		}
	}

	function gameOver() {
		if (d === "enter") {
			state = "playing";
			resetGame();
		}
	}

	function play() {
		context.fillStyle = background;
		context.fillRect(0, 0, width, height);
		context.strokeStyle = border;
		context.strokeRect(0, 0, width, height);

		var nx = snake[0].x;
		var ny = snake[0].y;

		checkInvincibility();
		checkIntro();

		if (d === "enter") {
			pause = true;
		} else {
			if (old_direction !== undefined) {
				d = old_direction;
				old_direction = undefined;
				pause = false;
			}

			if (d == "right") {
				nx++;
			} else if (d == "left") {
				nx--;
			} else if (d == "up") {
				ny--;
			} else if (d == "down") {
				ny++;
			} 
		}

		if (!pause && !intro) {
			if (nx <= -1 || nx >= numCellsWidth || ny <= -1 || ny >= numCellsHeight || checkCollision(nx, ny, snake)) {
				if (vibration) {
                	window.navigator.vibrate(500);
            	}
				state = "gameOver";
				level = levelDefault;
				checkRecord(score);
				invincible = false;
				return;
			}

			//if(nx == food.x && ny == food.y) {
			var hasEaten = hasEatenFood(nx,ny);
			if (hasEaten !== 0) {
				if (hasEaten === -1) {
					//incorrect food
					state = "gameOver";
					checkRecord(score);
					level = levelDefault;
					return;
				} else {
					//Food eaten!
					level += 1; 

					//Acttivating flash, so the snake is invincible
					invincible = true;
					foodEatenTimeStamp = Date.now();

					clearInterval(gameLoop);
					gameLoop = setInterval(update, 1000 / level);
				}

				var tail = {
					x: nx,
					y: ny
				};
				score++;
				//createFood();
				createRandomListFood();
				if (vibration) {
                	window.navigator.vibrate(100);
            	}
			} else {
				var tail = snake.pop();	 
				tail.x = nx;
				tail.y = ny;
			}

			snake.unshift(tail);
		}
	}

	function paint() {
		context.fillStyle = background;
		context.fillRect(0, 0, width, height);
		context.strokeStyle = border;
		context.strokeRect(0, 0, width, height);

		if (state === "gameOver") {
			paintGameOver();
		}

		//Painting the snake
		for (var i = 0; i < snake.length; i++) {
			var c = snake[i];
			paintCell(c.x, c.y, snakeColor, false);
		}

		//Painting the food
		contFlashing++;
		for (var i = 0; i < numFood; ++i) {
			paintCell(listFood[i].x, listFood[i].y, listFood[i].color, true);
		}

		//Painting the score
		var scoreText = "Score: " + score;
		context.fillText(scoreText, 5, height - 5);

		//Paint learning
		if (intro) {
			for (var i = 0; i < numCellsHeight; ++i) {
				paintCell(i,i,'black',true);
				var secondDiagonal = numCellsHeight - i;
				paintCell(secondDiagonal, i, 'black', true);
			}
		}

	}


	function checkInvincibility() {
		if (intro) {
			invincible = true;
			return;
		}

		if (invincible) {
			//Cheking time so we can deactivate the flashing
			var currTS = Date.now(); //currenTimeStamp
			if (currTS > rangeMSInvincible + foodEatenTimeStamp) {
				currTS = 0;
				invincible = false;
			}
		}
	}

	function checkIntro() {
		if (intro) {
			var currTSIntro = Date.now();
			if (currTSIntro > rangeIntro + timeStampIntro) {
				intro = false;
			}
		}
	}

	//Label size -> x = 20 ;;; y = 17
	function generateTextGameOver() {

		//Calculating offset depending on numCellsWidth and numCellsHeight
		//I check where is the center of what I have
		var centerX = numCellsWidth / 2;
		var centerY = numCellsHeight / 2;

		var offsetX = centerX - 12;
		var offsetY = centerY - 10;

		var clr = 'black';

		// G
		textGameOver.push({x: offsetX + 2, y: offsetY + 1, color:clr});
		textGameOver.push({x: offsetX + 3, y: offsetY + 1, color:clr});
		textGameOver.push({x: offsetX + 4, y: offsetY + 1, color:clr});
		textGameOver.push({x: offsetX + 5, y: offsetY + 2, color:clr});
		textGameOver.push({x: offsetX + 1, y: offsetY + 2, color:clr});
		textGameOver.push({x: offsetX + 1, y: offsetY + 3, color:clr});
		textGameOver.push({x: offsetX + 1, y: offsetY + 4, color:clr});
		textGameOver.push({x: offsetX + 1, y: offsetY + 5, color:clr});
		textGameOver.push({x: offsetX + 1, y: offsetY + 6, color:clr});
		textGameOver.push({x: offsetX + 2, y: offsetY + 7, color:clr});
		textGameOver.push({x: offsetX + 3, y: offsetY + 7, color:clr});
		textGameOver.push({x: offsetX + 4, y: offsetY + 7, color:clr});
        textGameOver.push({x: offsetX + 5, y: offsetY + 6, color:clr});
        textGameOver.push({x: offsetX + 5, y: offsetY + 4, color:clr});
        textGameOver.push({x: offsetX + 5, y: offsetY + 5, color:clr});
        textGameOver.push({x: offsetX + 4, y: offsetY + 4, color:clr});
        textGameOver.push({x: offsetX + 3, y: offsetY + 4, color:clr});

        // A
        textGameOver.push({x: offsetX + 8, y: offsetY + 1, color:clr});
        textGameOver.push({x: offsetX + 7, y: offsetY + 2, color:clr});
        textGameOver.push({x: offsetX + 7, y: offsetY + 3, color:clr});
        textGameOver.push({x: offsetX + 7, y: offsetY + 4, color:clr});
        textGameOver.push({x: offsetX + 7, y: offsetY + 5, color:clr});
        textGameOver.push({x: offsetX + 7, y: offsetY + 6, color:clr});
        textGameOver.push({x: offsetX + 7, y: offsetY + 7, color:clr});
        textGameOver.push({x: offsetX + 9, y: offsetY + 1, color:clr});
        textGameOver.push({x: offsetX + 10,y: offsetY + 1, color:clr});        
        textGameOver.push({x: offsetX + 11,y: offsetY + 2, color:clr});
        textGameOver.push({x: offsetX + 11,y: offsetY + 3, color:clr});
        textGameOver.push({x: offsetX + 11,y: offsetY + 4, color:clr});
        textGameOver.push({x: offsetX + 11,y: offsetY + 5, color:clr});
        textGameOver.push({x: offsetX + 11,y: offsetY + 6, color:clr});
        textGameOver.push({x: offsetX + 11,y: offsetY + 7, color:clr});
        textGameOver.push({x: offsetX + 8, y: offsetY + 4, color:clr});        
        textGameOver.push({x: offsetX + 9, y: offsetY + 4, color:clr});
        textGameOver.push({x: offsetX + 10,y: offsetY + 4, color:clr});

        // M
        textGameOver.push({x: offsetX + 13, y: offsetY + 1, color:clr});
        textGameOver.push({x: offsetX + 13, y: offsetY + 2, color:clr});
        textGameOver.push({x: offsetX + 13, y: offsetY + 3, color:clr});
        textGameOver.push({x: offsetX + 13, y: offsetY + 4, color:clr});
        textGameOver.push({x: offsetX + 13, y: offsetY + 5, color:clr});
        textGameOver.push({x: offsetX + 13, y: offsetY + 6, color:clr});
        textGameOver.push({x: offsetX + 13, y: offsetY + 7, color:clr});
        textGameOver.push({x: offsetX + 14, y: offsetY + 2, color:clr});
        textGameOver.push({x: offsetX + 15, y: offsetY + 3, color:clr});
        textGameOver.push({x: offsetX + 16, y: offsetY + 2, color:clr});
        textGameOver.push({x: offsetX + 17, y: offsetY + 1, color:clr});
        textGameOver.push({x: offsetX + 17, y: offsetY + 1, color:clr});
        textGameOver.push({x: offsetX + 17, y: offsetY + 2, color:clr});
        textGameOver.push({x: offsetX + 17, y: offsetY + 3, color:clr});
        textGameOver.push({x: offsetX + 17, y: offsetY + 4, color:clr});
        textGameOver.push({x: offsetX + 17, y: offsetY + 5, color:clr});
        textGameOver.push({x: offsetX + 17, y: offsetY + 6, color:clr});
        textGameOver.push({x: offsetX + 17, y: offsetY + 7, color:clr});

        // E
        textGameOver.push({x: offsetX + 19, y: offsetY + 1, color:clr});
        textGameOver.push({x: offsetX + 19, y: offsetY + 2, color:clr});
        textGameOver.push({x: offsetX + 19, y: offsetY + 3, color:clr});
        textGameOver.push({x: offsetX + 19, y: offsetY + 4, color:clr});
        textGameOver.push({x: offsetX + 19, y: offsetY + 5, color:clr});
        textGameOver.push({x: offsetX + 19, y: offsetY + 6, color:clr});
        textGameOver.push({x: offsetX + 19, y: offsetY + 7, color:clr});
        textGameOver.push({x: offsetX + 20, y: offsetY + 1, color:clr});
        textGameOver.push({x: offsetX + 20, y: offsetY + 4, color:clr});
        textGameOver.push({x: offsetX + 20, y: offsetY + 7, color:clr});
        textGameOver.push({x: offsetX + 21, y: offsetY + 1, color:clr});
        textGameOver.push({x: offsetX + 21, y: offsetY + 4, color:clr});
        textGameOver.push({x: offsetX + 21, y: offsetY + 7, color:clr});

        //O 
        textGameOver.push({x: offsetX + 2, y: offsetY + 11, color:clr});
        textGameOver.push({x: offsetX + 1, y: offsetY + 12, color:clr});
        textGameOver.push({x: offsetX + 1, y: offsetY + 13, color:clr});
        textGameOver.push({x: offsetX + 1, y: offsetY + 14, color:clr});
        textGameOver.push({x: offsetX + 1, y: offsetY + 15, color:clr});
        textGameOver.push({x: offsetX + 1, y: offsetY + 16, color:clr});
        textGameOver.push({x: offsetX + 2, y: offsetY + 17, color:clr});
        textGameOver.push({x: offsetX + 3, y: offsetY + 11, color:clr});
        textGameOver.push({x: offsetX + 4, y: offsetY + 11, color:clr});
        textGameOver.push({x: offsetX + 5, y: offsetY + 12, color:clr});
        textGameOver.push({x: offsetX + 5, y: offsetY + 13, color:clr});
        textGameOver.push({x: offsetX + 5, y: offsetY + 14, color:clr});
        textGameOver.push({x: offsetX + 5, y: offsetY + 15, color:clr});
        textGameOver.push({x: offsetX + 5, y: offsetY + 16, color:clr});
        textGameOver.push({x: offsetX + 4, y: offsetY + 17, color:clr});
        textGameOver.push({x: offsetX + 3, y: offsetY + 17, color:clr});

        // V
        textGameOver.push({x: offsetX + 7,  y: offsetY + 11, color:clr});
        textGameOver.push({x: offsetX + 7,  y: offsetY + 12, color:clr});
        textGameOver.push({x: offsetX + 7,  y: offsetY + 13, color:clr});
        textGameOver.push({x: offsetX + 7,  y: offsetY + 14, color:clr});
        textGameOver.push({x: offsetX + 8,  y: offsetY + 15, color:clr});
        textGameOver.push({x: offsetX + 8,  y: offsetY + 16, color:clr});
        textGameOver.push({x: offsetX + 9,  y: offsetY + 17, color:clr});
        textGameOver.push({x: offsetX + 10, y: offsetY +  16, color:clr});
        textGameOver.push({x: offsetX + 10, y: offsetY +  15, color:clr});
        textGameOver.push({x: offsetX + 11, y: offsetY +  14, color:clr});
        textGameOver.push({x: offsetX + 11, y: offsetY +  13, color:clr});
        textGameOver.push({x: offsetX + 11, y: offsetY +  12, color:clr});
        textGameOver.push({x: offsetX + 11, y: offsetY +  11, color:clr});

        // E
        textGameOver.push({x: offsetX + 13, y: offsetY + 11, color:clr});
        textGameOver.push({x: offsetX + 13, y: offsetY + 12, color:clr});
        textGameOver.push({x: offsetX + 13, y: offsetY + 13, color:clr});
        textGameOver.push({x: offsetX + 13, y: offsetY + 14, color:clr});
        textGameOver.push({x: offsetX + 13, y: offsetY + 15, color:clr});
        textGameOver.push({x: offsetX + 13, y: offsetY + 16, color:clr});
        textGameOver.push({x: offsetX + 13, y: offsetY + 17, color:clr});
        textGameOver.push({x: offsetX + 13, y: offsetY + 11, color:clr});
        textGameOver.push({x: offsetX + 14, y: offsetY + 14, color:clr});
        textGameOver.push({x: offsetX + 14, y: offsetY + 17, color:clr});
        textGameOver.push({x: offsetX + 14, y: offsetY + 11, color:clr});
        textGameOver.push({x: offsetX + 15, y: offsetY + 14, color:clr});
        textGameOver.push({x: offsetX + 15, y: offsetY + 17, color:clr});
        textGameOver.push({x: offsetX + 15, y: offsetY + 11, color:clr});

        // R
        textGameOver.push({x: offsetX + 17, y: offsetY + 12, color:clr});
        textGameOver.push({x: offsetX + 17, y: offsetY + 13, color:clr});
        textGameOver.push({x: offsetX + 17, y: offsetY + 14, color:clr});
        textGameOver.push({x: offsetX + 17, y: offsetY + 15, color:clr});
        textGameOver.push({x: offsetX + 17, y: offsetY + 16, color:clr});
        textGameOver.push({x: offsetX + 17, y: offsetY + 17, color:clr});
        textGameOver.push({x: offsetX + 18, y: offsetY + 11, color:clr});
        textGameOver.push({x: offsetX + 19, y: offsetY + 11, color:clr});
        textGameOver.push({x: offsetX + 20, y: offsetY + 11, color:clr});
        textGameOver.push({x: offsetX + 21, y: offsetY + 12, color:clr});
        textGameOver.push({x: offsetX + 21, y: offsetY + 13, color:clr});
        textGameOver.push({x: offsetX + 21, y: offsetY + 12, color:clr});
        textGameOver.push({x: offsetX + 20, y: offsetY + 14, color:clr});
        textGameOver.push({x: offsetX + 19, y: offsetY + 14, color:clr});
        textGameOver.push({x: offsetX + 18, y: offsetY + 14, color:clr});
        textGameOver.push({x: offsetX + 19, y: offsetY + 15, color:clr});
        textGameOver.push({x: offsetX + 20, y: offsetY + 16, color:clr});
        textGameOver.push({x: offsetX + 21, y: offsetY + 17, color:clr});

	}

	function generateTextPause() {
	}

	function paintGameOver() {
		var lng = textGameOver.length;
		for (var i = 0; i < lng; ++i) {
			paintCell(textGameOver[i].x, textGameOver[i].y, textGameOver[i].color, false);
		}
	}

	var invincible = true;

	//Pintamos la celda
	var contFlashing = 0;
	function paintCell(x, y, color, food)
	{	
		var doPaint = false;
		if (invincible && food) {
			doPaint = (contFlashing % 2 === 0);
		} else {
			//We aren't invincible
			doPaint = true;
		}

		if (doPaint || !food ) {
			context.fillStyle = color;
			context.fillRect(x * cellWidth, y * cellWidth, cellWidth, cellWidth);
			//If we are flashing, I'm going to paint yellow the food
			if (food && invincible) {
				context.strokeStyle = 'yellow';
			} else {
				context.strokeStyle = background;
			}
			context.strokeRect(x * cellWidth, y * cellWidth, cellWidth, cellWidth);
		}
	}

	//Verificiamos si hubo alguna colisión (si la hubo el juego se reinicia)
	function checkCollision(x, y, array)
	{
		for(var i = 0; i < array.length; i++)
		{
			if(array[i].x == x && array[i].y == y) {
				return true;
			}
		}	
		return false;
	}

	//Captamos las flechas de nuestro teclado para poder mover a nuestra víbora
	var lastTimeStamp = 0;
	var currentTimeStamp = 0;
	var rangeMS = 100;
	$(document).on('keydown', function(e) {

		currentTimeStamp = Date.now();
		if (currentTimeStamp > lastTimeStamp + rangeMS) {
			lastTimeStamp = currentTimeStamp;

			var key = e.which;
			if (key == "37" && d != "right") {
				d = "left";
			} else if (key == "38" && d != "down") {
				d = "up";
			} else if (key == "39" && d != "left") {
				d = "right";
			} else if (key == "40" && d != "up") {
				d = "down";
			} else if (key == "13" && d != "enter") {
				old_direction = d;
				d = "enter";
			}
		}
	});

	function checkRecord(punt) {
		if (punt > record) {
			var text = 'Record: ' + punt;
			$( "#record" ).text( text );
		}
	}
});