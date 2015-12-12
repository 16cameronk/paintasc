$(document).ready(function() {
	var currentBrush = 1;
	var currentBrushSize = 'Medium';
	var mousePointer = document.getElementById('mousePointer');
	var paintingArea = document.getElementById('paintingArea');
	var place = true;
	var clicking = false;
	var modalOpen = false;
	var controlBarHeight = $('#controlBar').height()+2; //2px border needs adding on
	var imgId = '';
		
	//on orientation change work out control bar height again
	window.addEventListener("resize", function() {
		var controlBarHeight = $('#controlBar').height()+2; //2px border needs adding on
	}, false);


	function placeTrump(event) {
		newTrump = document.createElement('div');
		newTrump.className += 'trumpInk trumpBrush' + currentBrush + currentBrushSize;
		newTrump.style.left = event.pageX-30 + 'px';
		newTrump.style.top = event.pageY-83 + 'px';
		paintingArea.appendChild(newTrump);
	}
	

	function changeBrush() {
		mousePointer.className = 'trumpBrush' + currentBrush + currentBrushSize;
	}
	
	$('.trumpBrushMenu').click(function() {
		currentBrush = $(this).attr('data-brush-number');
		$('.trumpBrushMenu').removeClass('trumpBrushMenuSelected');
		$(this).addClass('trumpBrushMenuSelected');
		changeBrush();
	})

	$('.brushSizeButton').click(function() {
		currentBrushSize = $(this).attr('data-brush-size');
		$('.brushSizeButton').removeClass('brushSizeButtonSelected');
		$(this).addClass('brushSizeButtonSelected');
		changeBrush();
	})
	
	//mouse or touch DOWN
	$(document).on('vmousedown', function(event) {

		//prevent painting when mouse is over brush controls
		if(event.pageY > controlBarHeight && modalOpen === false) { 
			clicking = true;
			placeTrump(event);
		}
	});
	
	//mouse or touch UP
	$(document).on('vmouseup', function(event) {
		clicking = false;
	});
	
	//mouse or touch MOVE
	$(document).on('vmousemove', function(event) {
		
		//pause painting when modal open
		if (modalOpen === true) return;

		//stick to mouse
		mousePointer.style.left = event.pageX-30 + 'px';
		mousePointer.style.top = event.pageY-28 + 'px';

		//obv
		if (clicking === false) return;
		
		//paint every other mouse movement, to save mad memory use
		if(place == false) {
			place = true;
			return;
		}
		
		placeTrump(event);
		place = false;

	});


	$('#clearPainting').click(function() {
		//remove all from DOM
		$('.trumpInk').remove();
	});

	$('#imgUploadURL').click(function() {
		$(this).select();
	});

	//assign div to act as modal
	var modalWindow = $('[data-remodal-id=modal]').remodal({hashTracking:false, closeOnConfirm:false});

	$(document).on('opening', '.remodal', function () {
		//to prevent brush from working when open
		modalOpen = true;
	});

	$(document).on('closing', '.remodal', function () {
		//to enable brush to work again
		modalOpen = false;
	});

	$('#fbSharePainting').click(function() {
		FB.ui({
			method: 'feed',
			picture: 'http://i.imgur.com/' + imgId + '.png',
			name: 'Paint With Donald Trump',
			link: 'http://paintwithdonaldtrump.com/?fakeurl',
			caption: 'paintwithdonaldtrump.com',
			description: $('#paintingCaption').val()
		}, function(response) {});
	});

	window.fbAsyncInit = function() {
		FB.init({
			appId: '412816462250749',
			xfbml: false,
			version: 'v2.2'
		});
	};



	$('#savePainting').click(function() {
		
		//reset upload stages
		$('#uploadStage2').hide();
		$('#uploadStage3').hide();
		$('#uploadStage1').show();
		
		modalWindow.open();

		//briefly show watermark for capture
		$('#pwdtWatermark').show();
		
		html2canvas(paintingArea, {
			onrendered: function(canvas) {
				
				//disappear it now snapshot has been taken!
				$('#pwdtWatermark').hide();

				//full quality jpeg for preview
				imagePreviewData = canvas.toDataURL('image/jpeg');
				
				//visibly update on preview thumbnail
				preview1 = document.getElementById('uploadPreview1');
				preview1.src = imagePreviewData;

				//visibly update 'Uploaded' thumbnail
				preview2 = document.getElementById('uploadPreview2');
				preview2.src = imagePreviewData;
				
				//slightly lossy version for upload
				imageDataUpload = canvas.toDataURL('image/jpeg', 0.7).replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
			}
		});
	});


	//clicking Upload...	
	$('.remodal-confirm').click(function() {
		$('#uploadStage1').hide();
		$('#uploadStage2').show();

		$.ajax({
			url: 'https://api.imgur.com/3/upload',
			headers: {
				'Authorization': 'Client-ID ff9723f7d980646'
			},
			type: 'POST',
			data: {
				'image': imageDataUpload,
				'album': 'GN6w2oHGJyvjPv8',
				'type': 'base64',
				'title': $('#paintingCaption').val(),
				'description': 'made with http://paintwithdonaldtrump.com/i'
			},
			success: function(result) {
				//grab newly created imgur ID
				imgId = result.data.id;

				//ping server with imgur ID
				$.get('img.php?i=' + imgId);
				
				//create Twitter button <a> link with base attributes
				var twitterButton = '<a href="https://twitter.com/share" id="tweetPainting" data-url="" data-count="none" data-text="Paint With Donald Trump http://paintwithdonaldtrump.com/ (@realDonaldTrump)">Tweet</a>';
				
				//destroy any button from previous upload so we don't share old image
				$('#tweetPaintingContainer').html('');
				
				//attach new button
				$('#tweetPaintingContainer').append(twitterButton);
				
				//add uploaded image link and twitter class so it gets found in rendering
				$('#tweetPainting').attr('data-url','http://imgur.com/' + imgId);
				$('#tweetPainting').addClass('twitter-share-button');

				$('#imgUploadURL').val('http://i.imgur.com/' + imgId + '.png');
				$('#imgUploadURLLink').attr('href','http://i.imgur.com/' + imgId + '.png');


				//render the new Tweet button!
				twttr.widgets.load(document.getElementById('tweetPainting'));

				$('#uploadStage2').hide();
				$('#uploadStage3').show();
			},
			error: function(result) {
				$.get('img.php?e=' + result.responseText);
			}
		});
	});
});