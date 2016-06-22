// TEXT THAT IS GREYED OUT INDICATED A COMMENT IN THE CODE. PLEASE READ THE COMMENTS AS, IN THIS TEMPLATE, THEY ARE NOTES TO YOU ABOUT HOW TO ALTER THIS /PEOPLE CARD IN A WAY THAT WILL REMAIN COMPATIBLE WITH THE COURSE WEBSITE! 

// Add your Javascript effects here.

var imageSpace = $('#evonPerez .headshot');

imageSpace.append('<img id="evonHelmet" class="baseImages" src="img/helmet.png" style="position: absolute; left: 20px; top: -70px;">');
var helmet = $("#evonHelmet");
imageSpace.append('<img id="evonArm" class="baseImages" src="img/arm.png" style="position: absolute; left: 20px; top: 170px;">');
var arm = $("#evonArm");
imageSpace.append('<img id="evonBlast" class="baseImages" src="img/blast.png" style="position: absolute; left: 20px; top: 170px;">');
var arm = $("#evonBlast");

imageSpace.append('<img id="evonGator" class="baseImages" src="img/gator.png" style="position: absolute; left: 120px; top: 80px;">');
var gator = $("#evonGator");


imageSpace.mouseover(function(){

  imageSpace.css('background-color', 'red');

  $('.baseImages').css('opacity', 1);
  helmet.animate({
    top: '20px'
  }, 1000, function(){
    helmet.attr('src', 'img/helmetGlow.png');
    arm.animate({
      top: '100px'
    });
  });
  gator.animate({
    left: '100px'
  }, 1000);


});

imageSpace.mouseout(function(){

  imageSpace.css('background-color', 'black');

  $('.baseImages').css({
    opacity: 0
  });
  helmet.css({
    top: '-70px'
  })
  helmet.attr('src', 'img/helmet.png');
  arm.css({
    top: '170px'
  })
  gator.css({
    left: '120px'
  })


});

// Below this line, you must change the id below ('#kanyewest') to reflect the id you created in the html panel for your partner ('#yourpartner')
window.addEventListener('load', function() {
  var myCard = document.querySelector('#evonPerez');
  var flipButtons = Array.prototype.slice.call(myCard.querySelectorAll('i.flip'));
  flipButtons.forEach(function(button) {
    button.addEventListener('click', function() {
      myCard.classList.toggle('flipped');
    });
  });
});