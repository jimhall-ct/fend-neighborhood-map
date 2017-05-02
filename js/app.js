// Google map
var map;
var largeInfoWindow;

function ViewModel() {
    var self = this;

    self.diningList = ko.observableArray([]);

    self.search = ko.observable('');
    self.mapAPILoaded = ko.observable(false);
    self.filterAmount = ko.computed(function() {
        return self.diningList().length;
    })

    locations.forEach(function(location, index) {
        location.id = index;
        self.diningList.push(location);
    });

    self.filterList = ko.computed(function() {
        self.diningList.removeAll();
        for (var i = 0; i < locations.length; i++) {
            if (locations[i].name.toLowerCase().indexOf(self.search().toLowerCase()) >= 0) {
                self.diningList.push(locations[i]);
                locations[i].visible = true;
            } else {
                locations[i].visible = false;
            }
        }
        if (self.mapAPILoaded()) {
            self.showMarkers();
        }
    });

    self.openList = function() {
        var menuCtr  = document.getElementById('menu-container');
        menuCtr.classList.toggle('showMenu');
        self.showMarkers();
    }
}


ViewModel.prototype.initMap = function () {
    var self = this;

    // Styles for map - turn off businesses as they will compete with custom markers
    var styles = [
        {
            "featureType": "poi.business",
            "stylers": [
                {"visibility": "off"}
            ]
        }
    ]

    // custom marker colors
    var defaultIcon = makeMarkerIcon('cc6666');
    var highlightedIcon = makeMarkerIcon('eeee33');

    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 41.355523, lng: -73.226103},
        zoom: 14,
        styles: styles,
        mapTypeControl: false
    });

    // Setup the map markers and add them to the locations array
    for (var i = 0; i < locations.length; i++) {
        var marker = new google.maps.Marker({
            map: map,
            position: locations[i].location,
            title: locations[i].name,
            icon: defaultIcon,
            id: i
        });
        // Add marker to the location object
        locations[i].marker = marker;
        // Create click event to open an infoWindow at each marker
        marker.addListener('click', function () {
            self.populateInfoWindow(this, largeInfoWindow);
        });
        marker.addListener('mouseover', function () {
            this.setIcon(highlightedIcon);
        });
        marker.addListener('mouseout', function () {
            this.setIcon(defaultIcon);
        });
    }

    // Function for creating custom markers
    function makeMarkerIcon(markerColor) {
        var markerImage = new google.maps.MarkerImage(
            'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor + '|40|_|%E2%80%A2',
            new google.maps.Size(21, 34),
            new google.maps.Point(0, 0),
            new google.maps.Point(10, 34),
            new google.maps.Size(21, 34));
        return markerImage;
    }

    largeInfoWindow = new google.maps.InfoWindow();

    // Map init finished loading
    this.mapAPILoaded(true);
};

// Create html infowindow to display when a marker or list item is clicked
ViewModel.prototype.populateInfoWindow = function(marker, infoWindow) {
    if (infoWindow.marker != marker) {
        getFourSquareData(marker);
        infoWindow.marker = marker;
        infoWindow.setContent('<div class="title">' + marker.title + '</div><div id="infoWin"></div>');
        infoWindow.open(map, marker);
        infoWindow.addListener('closeclick', function () {
            infoWindow.marker = null;
        });
    }
};

//display the appropriate markers
ViewModel.prototype.showMarkers = function() {
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < locations.length; i++) {
        if (locations[i].visible) {
            locations[i].marker.setAnimation(google.maps.Animation.DROP);
            locations[i].marker.setMap(map);
            // Extend the boundaries of the map for each marker
            bounds.extend(locations[i].marker.position);
        } else {
            locations[i].marker.setMap(null);
        }
    }
    // If there are no markers in search, bounds will be empty, if so keep current map position
    if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
    }
    // Limit the zoom level
    if (map.getZoom() > 16) {
        map.setZoom(16);
    }
};

ViewModel.prototype.highlightMarker = function(data, event) {
    map.setZoom(15);
    map.panTo(data.marker.getPosition());
    viewModel.populateInfoWindow(data.marker, largeInfoWindow);
    data.marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function() {
        data.marker.setAnimation(null);
    }, 3000);
};

function getFourSquareData(marker) {
    var lat = marker.getPosition().lat();
    var lng = marker.getPosition().lng();
    var searchRadius = 250;
    var todaysDate = getFormattedDate();
    var markerData = {};

    var fourSquareUrl = 'https://api.foursquare.com/v2/venues/search?ll=' + lat + ',' + lng + '&client_id=MWZFALHGOUCNBUJOFJDZ1VLQHZ51SERIIABSE44FWSM1URMK&client_secret=Y4K1HTBUX2KTHTDX0T3Q1KASCBONUU0CBVYIC220IRUBUDJJ&v=' + todaysDate + '&radius=' + searchRadius + '&query=' + marker.title + '&limit=1';

    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 200) {
                var data = JSON.parse(this.responseText);
                if (data.response.venues.length > 0) {
                    markerData.address = data.response.venues[0].location.formattedAddress[0];
                    markerData.cityState = data.response.venues[0].location.formattedAddress[1];
                    markerData.phone = data.response.venues[0].contact.formattedPhone;
                    markerData.website = data.response.venues[0].url;
                } else {
                    markerData.errorMsg = "No Contact Information";
                }
            } else {
                markerData.errorMsg = "Data Not Available";
            }
            displayData();
        }
    };
    httpRequest.open("GET", fourSquareUrl, true);
    httpRequest.send();

    function getFormattedDate() {
        var today = new Date();
        var mm = today.getMonth() + 1;
        var dd = today.getDate();

        return [today.getFullYear(),
            (mm > 9 ? '' : '0') + mm,
            (dd > 9 ? '' : '0') + dd,
        ].join('');
    }

    function displayData() {
        var el = document.getElementById('infoWin');
        el.innerHTML = '';

        if (markerData.errorMsg) {
            var error = document.createElement('div');
            error.textContent = markerData.errorMsg;
            el.appendChild(error);
        } else {
            var address = document.createElement('div');
            address.textContent = markerData.address;

            var cityState = document.createElement('div');
            cityState.textContent = markerData.cityState;

            var phone = document.createElement('div');
            phone.textContent = markerData.phone;

            var website = document.createElement('div');
            website.innerHTML = '<a href="' + markerData.website + '" target="_blank">website</a>';

            var attribution = document.createElement('div');
            attribution.innerHTML = '<a class="attribution" href="http://foursquare.com">Data by Foursquare</a>';

            if (markerData.address) {
                el.appendChild(address);
            }
            if (markerData.cityState) {
                el.appendChild(cityState);
            }
            if (markerData.phone) {
                el.appendChild(phone);
            }
            if (markerData.website) {
                el.appendChild(website);
            }
            el.appendChild(attribution);
        }
        el.style.opacity = 1;
    }
}

function mapError() {
    alert("An error occurred loading Google Maps. Try again later.")
}

var viewModel = new ViewModel();
ko.applyBindings(viewModel);
