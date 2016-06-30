// TEXT THAT IS GREYED OUT INDICATED A COMMENT IN THE CODE. PLEASE READ THE COMMENTS AS, IN THIS TEMPLATE, THEY ARE NOTES TO YOU ABOUT HOW TO ALTER THIS /PEOPLE CARD IN A WAY THAT WILL REMAIN COMPATIBLE WITH THE COURSE WEBSITE! 

// Add your Javascript effects here.

var imageSpace = $('#evonPerez .headshot');

imageSpace.append('<img id="evonHelmet" class="baseImages" src="http://ajkramer12-s15.github.io/card/img/helmet.png" style="position: absolute; left: 31px; top: -70px; opacity: 0;">');
var helmet = $("#evonHelmet"); // https://cdn4.iconfinder.com/data/icons/ironman_lin/256/ironman_III.png

imageSpace.append('<img id="evonArm" src="http://ajkramer12-s15.github.io/card/img/arm.png" style="position: absolute; left: -7px; top: 83px; opacity: 0; width: 0; height: 63px;">');
var arm = $("#evonArm"); // http://www.collectiondx.com/gallery2/gallery/d/688359-3/figuarts-iron-man-23.jpg

imageSpace.append('<img id="evonBlast" src="http://ajkramer12-s15.github.io/card/img/blast.png" style="position: absolute; left: 60px; top: 75px; transform: rotate(-20deg); opacity: 0;">');
var blast = $("#evonBlast"); // https://gradingfightscenes.files.wordpress.com/2014/03/picture19.png

imageSpace.append('<img id="evonGator" class="baseImages" src="http://ajkramer12-s15.github.io/card/img/gator.png" style="position: absolute; left: 150px; top: 55px; opacity: 0; transition: transform 1s;">');
var gator = $("#evonGator"); // http://www.tybeemarinescience.org/wp-content/uploads/2014/04/Alligator.jpg

var sequenceTriggered = false;

imageSpace.mouseover(function(){
  if(!sequenceTriggered) {
    sequenceTriggered = true;
    gator.css('opacity', 1);
    gator.animate({
      left: '100px'
    }, 1000, function () {
      helmet.css('opacity', 1);
      helmet.animate({
        top: '4px'
      }, 1000, function () {
        helmet.attr('src', 'http://ajkramer12-s15.github.io/card/img/helmetGlow.png');
        arm.css('opacity', 1);
        arm.animate({
          width: '123px'
        }, 1000, function () {
          blast.animate({
            opacity: 1
          }, 500, function () {
            gator.css('transition', 'opacity 1s, transform 1s');
            gator.css('transform', 'rotate(100deg)');
            gator.css('opacity', 0);
            blast.css('opacity', 0);
            arm.animate({
              width: 0
            }, 1000); // End arm withdraw
          }); // End blast appear
        }); // End arm move in
      }); // End helmet drop down and eye glow
    }); // End gator move in
  }

});

imageSpace.click(function(){
  console.log("out");
  gator.css({
    transition: 'transform 1s',
    transform: 'rotate(0deg)',
    left: '150px'
  });

  helmet.css({
    opacity: 0,
    top: '-70px'
  });
  helmet.attr('src', 'http://ajkramer12-s15.github.io/card/img/helmet.png');

  arm.css({
    opacity: 0,
    width: 0
  });

  blast.css({
    opacity: 0,
  });

  sequenceTriggered = false;
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