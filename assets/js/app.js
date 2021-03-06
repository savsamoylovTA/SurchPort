$(document).ready(function(){

//===============================================================================================================
//  appProps Object
//---------------------------------------------------------------------------------------------------------------
//
//  Used to store API Keys.
//
//  appProps{} -
//              fs{} - Stores Foursquare API keys.
//              gm{} - Will store Google Maps keys.
//              fBase{} - Firebase Config
//
//
//
//===============================================================================================================

const appProps = {
    fs: { //  FOURSQUARE API    
        clientID: config.fs.clientID,
        clientSECRET: config.fs.clientSECRET,
    },    
    gm: {
        key: config.gm.key,
    },
    fBase: {
        config: {
                apiKey: config.fBase.config.apiKey,
                authDomain: config.fBase.config.authDomain,
                databaseURL: config.fBase.config.databaseURL,
                projectId: config.fBase.config.projectId,
                storageBucket: config.fBase.config.storageBucket,
                messagingSenderId: config.fBase.config.messagingSenderId
              },
    },
}

//===============================================================================================================
// END appProps Object
//===============================================================================================================





//===============================================================================================================
//  appFuncs Object
//---------------------------------------------------------------------------------------------------------------
//
// appFuncs{} -
//
//          search{} -
//                  listenSearch - On search submit, grabs the venues and location values, validates them, and 
//                                 passes them on to initSearch.
//
//                  initSearch   - Takes the values from  listenSearch and uses them inside our AJAX call to the
//                                 FOURSQUARE API. Gets the necessary variables (Name, Rating, Location, Photos) 
//                                 and passes them on to printSearchResults.
// 
//                  printSearchResults -Takes the values from initSearch and renders them onto the page as our
//                                      search results
//
//          venueCard{} -
//                  clickCard - Listens for clicks on individual venue cards and passes on the venue id to be used 
//                              for an AJAX call to the FOURSQUARE API in initVenueModal.
//
//                  initVenueModal - Makes an AJAX call to the FOURSQUARE API, and returns and formats tbe data corresponding
//                                   to our modal pop-up interface. Passes the data to renderVenueModal to be rendered on the 
//                                   screen. 
//
//                  renderVenueModal - Takes the data and renders the modal pop-up on the screen with all the relevant data.
//
//          favorites{} -
//                  favClicked - Tracks when the favorites button is clicked. Is toggled to avoid Duplicates on search results.
//
//                  listenFav - Listens for when the Add to Favorites button is clicked, and passes the venue-id to initFavStorage.
//
//                  initFavStorage - Stores venue-id in Firebase Database. 
//
//                  loadFavSection - When the Favorites Section button is clicked, gets all the favorited venue-id's from Firebase
//                                   and uses an AJAX call to get all the relevant information to pass to renderFavPage.
//
//                  renderFavPage- Takes the data from loadFavSection and renders it on screen.
//
//          ui{} -
//                  googleMapsFrame - Renders the Google Maps to be used in Venue Modal Pop-up.
//
//                  starRating - Takes the rating value from initSearch, converts it and returns it to be used in 
//                               the rendering of the 5-Star field.
// 
//                  listenScroll - Listens for and tracks the users scrolling activities. Calls listenScrollDown and
//                                 listenScrollUp.
//
//                  listenScrollDown - When the user scrolls down past a certain point, changes the appearance of 
//                                     the header.
//
//                  listenScrollUp - When the user scrolls up past a certain point, changes the appearance of 
//                                   the header.
//
//                  messages{} -
//                             warning - Takes the value of a warning message passed to it from another function
//                                       and renders it to the screen.
//
//===============================================================================================================

var appFuncs ={
    search:{
        listenSearch: function(){
            $("#searchSubmit").on("click",function(event){
                event.preventDefault();
                appFuncs.favorites.favClicked = false;

                var bizSearch = $("#bizSearch").val().trim();
                var locationSearch = $("#locationSearch").val().trim();

                if (bizSearch === "" || locationSearch === ""){
                    var warningMessage = "Oops! Make sure that all search fields are filled out.";
                    $(".warning--Message").remove();
                    appFuncs.ui.messages.warning(warningMessage);
                } else if(locationSearch.length === 2){
                    var warningMessage = "Oops! Make sure to include a town with your location.";
                    $(".warning--Message").remove();
                    appFuncs.ui.messages.warning(warningMessage);
                }else{
                    appFuncs.search.initSearch(bizSearch, locationSearch);
                }
            });
        },
        initSearch: function(search, location){
            $.ajax({
                url:`https://api.foursquare.com/v2/venues/explore?v=20170630&query=${[search]}&near=${[location]}&limit=30&venuePhotos=1&client_id=${[appProps.fs.clientID]}
                &client_secret=${[appProps.fs.clientSECRET]}`,
                method: "GET"
            })
            .done(function(response){
                // API Object Path
               // console.log(response);
                const biz = response.response.groups[0].items;

                $(".results").html('');
                $(".content--Heading").html("Search results");

                for(var i = 0; i < biz.length; i++ ){
                    //console.log(biz[i]);
                    var bizName = biz[i].venue.name;
                    var bizRating = biz[i].venue.rating;
                    var bizCity = biz[i].venue.location.city;
                    var bizId = biz[i].venue.id;
                    
                    // Build Venue Image Url
                    var imgPrefix = biz[i].venue.photos.groups[0].items[0].prefix;
                    var imgSize = "325x222";
                    var imgSuffix = biz[i].venue.photos.groups[0].items[0].suffix;
                    var bizImage = imgPrefix+imgSize+imgSuffix;

                    // Get Rating Div Width value
                    var starWidth = appFuncs.ui.starRating(bizRating);


                    appFuncs.search.printSearchResults(bizName, starWidth, bizCity, bizImage, bizId );
                }
            
            });
        },
        printSearchResults: function (bizName, starWidth, bizCity, bizImage, bizId  ){
            $('html, body').scrollTop(300);
            appFuncs.favorites.favClicked = false;
            $(".results").append(`
                <div class="card--Result" data-venueid="${[bizId]}">
                    <div class="card--Result__Img">
                        <img src="${[bizImage]}" alt="" width="100%" class="img-responsive">
                        <div class="shadow cardLaunch" data-venueid="${[bizId]}"></div>
                                    <div class="cardFavBtn favThisBtn" data-venueid="${[bizId]}"><i class="fa fa-star-o favStar " aria-hidden="true"></i></div>
                    </div>
                    <div class="card--Result__Info cardLaunch" data-venueid="${[bizId]}">
                        <h3 class="card--Title" title="${[bizName]}">${[bizName]}</h3>
                        <div class="card--Rating">
                            <div class="card--Rating__Overlay" style=width:${[starWidth]}>
                                <img src="assets/imgs/starsFill.png" alt="">
                            </div>
                        </div>
                        <div class="card--Location">
                            <p><span><img src="assets/imgs/cardLocation.png" alt=""></span>${[bizCity]}</p>
                        </div>
                    </div>
                </div>
            `);
        },
    },
    venueCard:{
        clickCard: function(){

            $(document).on("click", ".cardLaunch", function(){
              //  console.log("clicked")
                var venueID = $(this).data("venueid");
                                //${[venueID]}

                appFuncs.venueCard.initVenueModal(venueID);


            })
        },
        initVenueModal: function(venueID){
          //  console.log(venueID);
            $.ajax({
                url: `https://api.foursquare.com/v2/venues/${[venueID]}?v=20170630&client_id=${[appProps.fs.clientID]}
                &client_secret=${[appProps.fs.clientSECRET]}`,
                method: "GET",
            })
            .done(function(response){
               // console.log(response);


                var venue = response.response.venue;

                //====================== GETTING VENUE VALUES to pass on to the Modal Box.

                // Biz Id

                var bizId = venue.id;

                // Name

                var bizName = venue.name;

                // Ratings

                // Star Rating Widget

                var bizRating = getStarRating(); // Star Field

                function getStarRating(){
                    if (venue.hasOwnProperty('ratingSignals')){
                        var starFieldWidth = appFuncs.ui.starRating(venue.rating);
                        return `${[starFieldWidth]}`;
                    }else{
                        return "0";
                    }
                };

                // Number of Ratings   

                var bizRatingNumb = getBizRatingNumb();

                function getBizRatingNumb(){
                    if (venue.ratingSignals >= 1){
                        return `${[venue.ratingSignals]} ratings`;
                    } else {
                        return "No ratings yet";
                    }
                };

                // Price Tier ($$$$)

                var bizPriceTier = getPriceTier();

                function getPriceTier(){
                    var priceIconsArray = [];

                    if (venue.hasOwnProperty('price')){
                        for (var i = 0; i < venue.price.tier; i++) {
                            var dollarSign = "$";
                            priceIconsArray.push(dollarSign);

                        }
                    } 
                    return priceIconsArray.join("");
                    
                };

                // Category Tags

                var bizTags = getBizTags();

                function getBizTags(){
                    var tagsArray = [];

                        for (var i = 0; i < venue.categories.length; i++) {

                            if (i <= 1 ){
                                var tags = "<a href='#/''>"+venue.categories[i].name+"</a>";
                                tagsArray.push(tags);
                            }
                        }

                    return tagsArray.join(", ")
                };

                // Contact Info

                var bizAddress = `${[venue.location.formattedAddress[0]]}</br>${[venue.location.formattedAddress[1]]}`;

                var bizDirections = `https://www.google.com/maps/place/${[venue.location.formattedAddress[0]]} ${[venue.location.formattedAddress[1]]}`;
                
                var bizUrl = getBizUrl();

                function getBizUrl(){
                    if (venue.hasOwnProperty('url')){
                        return `<a href="${[venue.url]}" target="_blank" class="venueUrl">${[venue.url]}</a>`;
                    } else {
                        return "No website provided"
                    }
                };
               
                var bizPhone = getBizPhone();

                function getBizPhone(){
                    if (venue.contact.hasOwnProperty('formattedPhone')){
                        return venue.contact.formattedPhone;
                    } else {
                        return "No phone provided"
                    }
                };

                // Business Image

                var bizImage = getBizImage();

                function getBizImage(){
                    if (venue.hasOwnProperty('bestPhoto')){
                        return `${[venue.bestPhoto.prefix]}325x222${[venue.bestPhoto.suffix]}`;
                    }
                };

                // Business Hours

                var bizOpenStatus = getBizOpenStatus();

                function getBizOpenStatus(){
                    
                    if (venue.hasOwnProperty('hours')){
                        return venue.hours.status;
                    } else {
                        return "No time information provided.";
                    }
                }

                var bizTimeFrames = getBizTimeFrames();

                function getBizTimeFrames(){
                    var renderedTimesArray = [];
                    var daysArray = [];
                    var hoursArray = [];

                    if (venue.hasOwnProperty('hours')){

                        for (var i = 0; i < venue.hours.timeframes.length; i++) {
                            var days = venue.hours.timeframes[i].days;
                            daysArray.push(days);
                        }

                        for (var i = 0; i < venue.hours.timeframes.length; i++) {
                            var hours = venue.hours.timeframes[i].open[0].renderedTime;
                            hoursArray.push(hours);
                            
                        }

                        for (var i = 0; i < daysArray.length; i++) {
                            var operatingTimes = `
                                <div class="hours--Slot">
                                    <p class="dayData">${[daysArray[i]]}</p>
                                    <div class="timeData">
                                        <div class="timeSlot">${[hoursArray[i]]}</div>
                                    </div>
                                </div>
                            `;
                            renderedTimesArray.push(operatingTimes);
                        }
                        return renderedTimesArray.join("");
                    }
                };


                // Get Tips

                var bizTips = getBizTips();

                function getBizTips(){

                    var tipInfoArray = [];
                    var bizTipsArray = [];

                    if (venue.tips.groups[0].items.length <= 3 ){
                        for (var i = 0; i < venue.tips.groups[0].items.length; i++) {
                            var tipInfo =[
                                // Image
                               `${[venue.tips.groups[0].items[i].user.photo.prefix]}35x35${[venue.tips.groups[0].items[i].user.photo.suffix]}`,
                                // Name
                                `${[venue.tips.groups[0].items[i].user.firstName]} ${[venue.tips.groups[0].items[i].user.lastName]}`,
                                // Tip
                                `${[venue.tips.groups[0].items[i].text]}`,
                            ];
                            tipInfoArray.push(tipInfo);

                        }
                    } else {
                        for (var i = 0; i <= 3; i++) {
                            var tipInfo =[
                                // Image
                               `${[venue.tips.groups[0].items[i].user.photo.prefix]}35x35${[venue.tips.groups[0].items[i].user.photo.suffix]}`,
                                // Name
                                `${[venue.tips.groups[0].items[i].user.firstName]} ${[venue.tips.groups[0].items[i].user.lastName]}`,
                                // Tip
                                `${[venue.tips.groups[0].items[i].text]}`,
                            ];
                            tipInfoArray.push(tipInfo);

                        }
                    }


                    for (var i = 0; i < tipInfoArray.length; i++) {
                        var tipCard = `
                            <div class="tipCard biz--Modal__card">
                                <div class="tipCard--Header">
                                    <img src="${[tipInfoArray[i][0]]}" class="tipCard--UserImg img-circle " alt="user image" />
                                    <h4 class="tipCard--UserName">${[tipInfoArray[i][1]]}</h4>
                                    <a href="#/" class="tipCard--Options" ><img src="assets/imgs/tipCardOptions.png" alt="options" /></a>
                                </div>
                                <div class="tipCard--Tip">
                                    ${[tipInfoArray[i][2]]}
                                </div>
                            </div>
                        `;

                        bizTipsArray.push(tipCard);


                    }

                    return bizTipsArray.join(" ");
                    //console.log(bizTipsArray);


                };

                // Get Photos

                var bizPhotos = getBizPhotos();

                function getBizPhotos(){
                    var bizPhotosRenderingArray = [];
                    var bizPhotosArray = [];

                    if (venue.photos.groups.length != 0){

                        for (var i = 1; i < venue.photos.groups[0].items.length; i++) {
                            
                            if (i <= 4){
                                var venuePhoto = `${[venue.photos.groups[0].items[i].prefix]}135x135${[venue.photos.groups[0].items[i].suffix]}`;
                                bizPhotosArray.push(venuePhoto);
                            }
                        }

                        for (var i = 0; i < bizPhotosArray.length; i++) {
                            var venuePhotoRender = `<a href="#/"><img src="${[bizPhotosArray[i]]}" class="img-responsive" alt="" /></a>`;
                            bizPhotosRenderingArray.push(venuePhotoRender);
                        }
                        return bizPhotosRenderingArray.join(" ");

                    } else {
                        return `No Photos`;
                    }
                };

                // Get Map

                var constructedAddr = venue.location.address + venue.location.city + venue.location.postalCode;

                var bizMap = appFuncs.ui.googleMapsFrame(constructedAddr, venue.location.lat, venue.location.lng );


                appFuncs.venueCard.renderVenueModal(bizImage, bizName, bizRating, bizRatingNumb, bizPriceTier, bizTags, bizAddress, bizDirections, bizUrl, bizPhone, bizOpenStatus, bizTips, bizPhotos, bizTimeFrames, bizMap, bizId );

            })
        },
        renderVenueModal: function (bizImage ,bizName, bizRating, bizRatingNumb, bizPriceTier, bizTags, bizAddress, bizDirections, bizUrl, bizPhone, bizOpenStatus, bizTips, bizPhotos, bizTimeFrames, bizMap, bizId){
                $("body").addClass("noScroll");



                var modal = `
                            <div class="result--Modal">
                                <div class="result--Modal__Close">CLOSE <img src="assets/imgs/closeModal.png" alt="" /> </div>
                                <div class="biz--Modal clearfix">
                                    <div class="biz--Modal__sidebar">
                                        <div class="biz--TitleCard biz--InfoCard biz--Modal__card">
                                            <div class="biz--TitleCard__Img">
                                                <img src="${[bizImage]}" alt="">
                                            </div>
                                            <div class="biz--InfoCard__content">
                                                <h3>${[bizName]}</h3>
                                                <div class="biz--TitleCard__Rating">
                                                    <div class="card--Rating__Overlay" style="width:${[bizRating]}">
                                                        <img src="assets/imgs/starsFill.png" alt="">
                                                    </div>
                                                </div>
                                                <p class="biz--Ratings">${[bizRatingNumb]}</p>
                                                <div class="biz--TitleCard__Tags">
                                                    <div class="card--PricePoint"><h3>${[bizPriceTier]}</h3></div>
                                                    <div class="biz--Tags">
                                                        ${[bizTags]}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="biz--MapCard biz--InfoCard biz--Modal__card">
                                            <div class="biz--MapCard__Map" id="map">
                                                ${[bizMap]}
                                            </div>
                                            <div class="biz--InfoCard__content">
                                                <div class="biz--ContactInfo">
                                                    <div class="biz--ContactIcon"><img src="assets/imgs/locationModal.png" alt="address"/></div>
                                                    <div class="biz--ContactDetails">
                                                        ${[bizAddress]}
                                                        </br>
                                                        <a href="${[bizDirections]}" target="_blank" class="bizDirectionsLink">Get directions</a>
                                                    </div>
                                                </div>
                                                <div class="biz--ContactInfo">
                                                    <div class="biz--ContactIcon"><img src="assets/imgs/linkModal.png" alt="website"/></div>
                                                    <div class="biz--ContactDetails">

                                                        ${[bizUrl]}

                                                    </div>
                                                </div>
                                                <div class="biz--ContactInfo">
                                                    <div class="biz--ContactIcon"><img src="assets/imgs/phoneModal.png" alt="phone"/></div>
                                                    <div class="biz--ContactDetails">
                                                        <phone>${[bizPhone]}</phone>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="biz--HoursCard biz--InfoCard biz--Modal__card">
                                            <div class="biz--InfoCard__content">
                                                <div class="hours--Icon"><img src="assets/imgs/hoursModal.png" alt="hours"/></div>
                                                <div class="hours--Status">${[bizOpenStatus]}</div>
                                                <div class="hours--Details">

                                                    ${[bizTimeFrames]}

                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="biz--Modal__content">
                                        <div class="biz--Modal__actions">
                                            <ul>
                                                <li><button class="btn btnColorGreen favThisBtn" data-venueid="${[bizId]}">  <i class="fa fa-star-o favStar" aria-hidden="true"></i>
ADD TO FAVORITES</button></li>
                                                <li><button class="btn btnColorBlue">ADD TO LIST</button></li>
                                                <li>
                                                    <a href="#/" data-toggle="tooltip" title="Share"><img src="assets/imgs/shareModal.png" alt="share" /></a>
                                                </li>
                                                <li>
                                                    <a href="#/" data-toggle="tooltip" title="Options"><img src="assets/imgs/optionsModal.png" alt="other options"/></a>
                                                </li>
                                            </ul>
                                        </div>
                                        <div class="biz--Modal__Heading">
                                            <h2>Tips</h2>
                                            <a href="#/">See more</a>
                                        </div>

                                            ${[bizTips]}

                                        <div class="biz--Modal__Heading">
                                            <h2>Photos</h2>
                                            <a href="#/">See more</a>
                                        </div>
                                        <div class="photosCard biz--Modal__card ">

                                            ${[bizPhotos]}

                                        </div>
                                    </div>
                                </div>
                            </div>
                          `;


                    // To Overwrite jQueryUI Modal Styling and  make it look "on-brand".

                    $.extend( $.ui.dialog.prototype.options.classes, {
                        "ui-dialog": "app--Modal",
                        "ui-dialog-titlebar": "modal-header",
                        "ui-dialog-title": "modal-title",
                        "ui-dialog-titlebar-close": "close",
                        "ui-dialog-content": "app--Modal__Body",
                        "ui-dialog-buttonpane": "app--Modal__Footer",
                    });



                   $(modal).dialog({
                      show: { effect: "fadeIn", duration: 100 },
                      draggable:false,
                      resizable: false,
                      width: "100%",
                      title: "",
                      position: { my: "center", at: "center top", of: ".page" },
                      buttons: [
                        {
                          text: "OK",
                          click: function() {
                            $( this ).dialog( "close" );
                          }
                     
                        }
                      ],

                    });

                   $(".result--Modal").css({
                    position: "fixed",
                    "z-index": "10",
                    background: "rgba(13, 13, 14, 0.95)",
                    left: "0",
                    top: "0",
                    width: "100%",
                    height: "100%",
                    "overflow-x": "hidden",
                   });

                $(".app--Modal").css({
                    "overflow-x": "hidden",
                    left: "0",
                    "z-index": "10",
                   });

                $(".result--Modal__Close").on("click", function(){
                    $(".result--Modal").remove();
                    $("body").removeClass("noScroll");
                })

                $('[data-toggle="tooltip"]').tooltip(); 
        },
    },
    favorites:{
        favClicked: false, // Keeps track of when the Favorite Button was clicked in order to avoid Duplicates from appearing on search page.
        listenFav: function(){ // Listens for when the Favorites Button was clicked.
            $(document).on("click", ".favThisBtn", function(){
                var venueID = $(this).attr("data-venueid");
                var db = firebase.database();

                var $this = $(this); //In order to target the correct button inside the firebase function

                db.ref().orderByChild("favVenue").equalTo(venueID).once("value", function(snapshot) {
                    var favMatch = snapshot.val();
                    if (favMatch){
                      //console.log("exists!");
                    } else{
                        appFuncs.favorites.initFavStorage(venueID);
                        $(".favStar", $this).removeClass("fa-star-o").addClass("fa-star").css({opacity:"1"});
                    }
                });

                


            })
        },
        initFavStorage: function(venueID){ // Stores the Favorited Venue Id in Firebase Database.

              
               var db = firebase.database();

                var favVenue = venueID;

                 db.ref().push({
                        favVenue: favVenue,
                })

        },
        loadFavSection: function(){ // Populates the Favorites section with all the locations the user saved.
            $("#favoritesBtn").on("click", function(){

                appFuncs.favorites.favClicked = true;
            
                $(".results").html("");
                $(".content--Heading").html("Favorites");

                 var db = firebase.database();

                 db.ref().on("child_added", function(snapshot){
                    var favObj = snapshot.val().favVenue;

                    snapshot.forEach(function(favObj){
                   
                       var favVenueId = favObj.val();
                       var favArray = [];
                       
                       favArray.push(favVenueId);
                       

                        $.ajax({
                            url: `https://api.foursquare.com/v2/venues/${[favVenueId]}?v=20170630&client_id=${[appProps.fs.clientID]}
                            &client_secret=${[appProps.fs.clientSECRET]}`,
                            method: "GET",
                        })
                        .done(function(response){
                           // console.log(response);
                            var fav = response.response.venue;
                            var favId = favVenueId;
                            var favName = fav.name;
                            var favImage = `${[fav.bestPhoto.prefix]}325x222${[fav.bestPhoto.suffix]}` ;
                            var favRating = fav.rating;
                            var favStarWidth = appFuncs.ui.starRating(favRating);
                            var favLocation = fav.location.city;

                            appFuncs.favorites.renderFavPage(favId, favName, favImage, favStarWidth, favLocation)
                        });

                    });      
                                          
                 });

           

            });
        },
        renderFavPage: function(favId, favName, favImage, favStarWidth, favLocation){
            if (appFuncs.favorites.favClicked === true){
           // console.log(favId);
            $(".results").prepend(`
                <div class="card--Result" data-venueid="${[favId]}">
                    <div class="card--Result__Img">
                        <img src="${[favImage]}" alt="" width="100%" class="img-responsive">
                        <div class="shadow cardLaunch" data-venueid="${[favId]}"></div>
                    </div>
                    <div class="card--Result__Info cardLaunch" data-venueid="${[favId]}">
                        <h3 class="card--Title" title="${[favName]}">${[favName]}</h3>
                        <div class="card--Rating">
                            <div class="card--Rating__Overlay" style=width:${[favStarWidth]}>
                                <img src="assets/imgs/starsFill.png" alt="">
                            </div>
                        </div>
                        <div class="card--Location">
                            <p><span><img src="assets/imgs/cardLocation.png" alt=""></span>${[favLocation]}</p>
                        </div>
                    </div>
                </div>
                `);
            
           }
           
        }

    },
    ui:{
        googleMapsFrame: function(bizAddress, lat, lng){
            var mapframe = `
                <iframe
                  width="100%"
                  height="200"
                  frameborder="0" style="border:0"
                  scrolling="no"
                  src="https://www.google.com/maps/embed/v1/place?key=${[appProps.gm.key]}
                    &q=${[bizAddress]}&center=${[lat]},${[lng]}">
                </iframe>
            `;
            return mapframe
        },
        starRating: function(rating){
            var starsRating = rating/10;
            var starsWidthNum = 100;
            var newWidth = starsRating * starsWidthNum;
           
            return Math.ceil((newWidth+1))+"%";
        },
        listenScroll: function(){

            $(document).on("scroll", function(){
                var scrollPosition = window.pageYOffset;
                appFuncs.ui.listenScrollDown(scrollPosition);
                appFuncs.ui.listenScrollUp(scrollPosition);
            }); 

        },
        listenScrollDown: function(scrollPosition){
            if (scrollPosition > 263){
                $(".header--Search").css({
                    position:"fixed",
                    top:"0",
                    left:"90px",
                    width:"100%",
                    height:"69px",
                    transition: ".2s",
                    borderRadius: "0",
                    borderBottom: "1px solid #a9c7ce",
                    boxShadow: "none",
                })

                $(".header--Search__Input").css({
                    width:"294px",
                    height: "67px",
                    borderRadius: "0",
                    borderRight: "1px solid #dbdee3",
                })

                $(".header--Interface").css({
                    position:"fixed",
                    right: "10px",
                    transition: ".2s",
                })

            }
        },
        listenScrollUp: function(scrollPosition){
            if (scrollPosition <= 263){

                $(".header--Search").css({
                    position: "absolute",
                    left:"calc(50% - 294px)",
                    bottom:"-35px",
                    height: "70px",
                    width:"588px",
                    borderRadius:"5px",
                    border:"none",
                    top:"",
                    "-moz-box-shadow":  "0 15px 18px -5px #b7d1d6",
                    "-webkit-box-shadow":  "0 15px 18px -5px #b7d1d6",
                    "box-shadow":          "0 15px 18px -5px #b7d1d6",
                })

                $(".header--Search__Input").css({
                    width:"50%",
                    height: "70px",
                    borderRadius: "5px",
                    borderRight: "1px solid #dbdee3",
                })

                $(".header--Interface").css({
                    position:"relative",
                })
            }
        },
        messages: {
            warning: function (message){
                var msg = `
                            <div class="app--Message">
                                <p>${[message]}</p>
                                <button class="closeWarning"><img src="assets/imgs/closeWarning.png" alt="close" /></button>
                            </div>
                          `;

                    $.extend( $.ui.dialog.prototype.options.classes, {
                        "ui-dialog": "warning--Message",
                        "ui-dialog-titlebar": "modal-header",
                        "ui-dialog-title": "modal-title",
                        "ui-dialog-titlebar-close": "close",
                        "ui-dialog-content": "warning--Message__Body",
                        "ui-dialog-buttonpane": "warning--Message__Footer",
                    });



                   $(msg).dialog({
                      show: { effect: "slideDown", duration: 400 },
                      draggable:false,
                      resizable: false,
                      width: "445px",
                      title: "",
                      position: { my: "center", at: "center top", of: ".page" },
                      buttons: [
                        {
                          text: "OK",
                          click: function() {
                            $( this ).dialog( "close" );
                          }
                     
                        }
                      ],

                    });
  
                   $(".warning--Message").css({
                    position: "relative",
                  });


                   $("div.ui-dialog-buttonset > button").addClass("btn btn--FullWidth btnColorWarning");

                   $(".closeWarning").on("click", function(){
                    $(".warning--Message").remove();
                   })


            }

        },

    }
}
//===============================================================================================================
// END appFuncs Object
//===============================================================================================================


// Listen for Search Event
appFuncs.search.listenSearch();

// Listen for Scroll Event
appFuncs.ui.listenScroll();

// Listen for Venue Card Click Events
appFuncs.venueCard.clickCard();

// Listen for Favorites Click Events
appFuncs.favorites.listenFav();

if (appFuncs.favorites.favClicked === false){
    appFuncs.favorites.loadFavSection();
}


// Bootstrap Tooltip Init
$('[data-toggle="tooltip"]').tooltip(); 

// Initialize Firebase
firebase.initializeApp(appProps.fBase.config);


});
