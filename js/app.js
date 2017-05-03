// Google map variables
var map;
var largeInfoWindow;

function ViewModel() {
    var self = this;

    self.diningList = ko.observableArray([]);

    // initial population the observable array
    locations.forEach(function (location, index) {
        location.id = index;
        self.diningList.push(location);
    });
    // whether to show/hide location list
    self.showList = ko.observable(false);
    // text input filter search
    self.search = ko.observable('');
    // number of filtered search results
    self.filterAmount = ko.computed(function () {
        return self.diningList().length;
    });

    self.filterList = ko.computed(function () {
        self.diningList.removeAll();
        for (var i = 0; i < locations.length; i++) {
            // check if the search string is part of the location name
            if (locations[i].name.toLowerCase().indexOf(self.search().toLowerCase()) >= 0) {
                self.diningList.push(locations[i]);
                locations[i].visible = true;
            } else {
                locations[i].visible = false;
            }
        }
        if (map) {
            showMarkers();
        }
    });

    // function to open/close the location list menu
    self.openList = function () {
        self.showList(!self.showList());
        showMarkers();
    };

    self.highlightMarker = function (data) {
        map.setZoom(15);
        // center map to the chosen marker
        map.panTo(data.marker.getPosition());
        // run the google event listener code
        google.maps.event.trigger(data.marker, 'click');
    };
}

function initMap() {
    // Styles for map - turn off businesses as they will compete with custom markers
    var styles = [
        {
            "featureType": "poi.business",
            "stylers": [
                {"visibility": "off"}
            ]
        }
    ];

    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 41.355523, lng: -73.226103},
        zoom: 14,
        styles: styles,
        mapTypeControl: false
    });

    largeInfoWindow = new google.maps.InfoWindow();

    // custom marker colors
    var defaultIcon = makeMarkerIcon('cc6666');
    var highlightedIcon = makeMarkerIcon('eeee33');

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
            populateInfoWindow(this, largeInfoWindow);
            // turn on bounce animation for marker
            this.setAnimation(google.maps.Animation.BOUNCE);
            // turn off bounce animation after 3 seconds
            setTimeout(function () {
                this.setAnimation(null);
            }.bind(this), 2100);
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
        return new google.maps.MarkerImage(
            'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor + '|40|_|%E2%80%A2',
            new google.maps.Size(21, 34),
            new google.maps.Point(0, 0),
            new google.maps.Point(10, 34),
            new google.maps.Size(21, 34));
    }

    window.addEventListener('resize', function () {
        showMarkers();
    });

    showMarkers();
}

//display the appropriate markers
function showMarkers() {
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < locations.length; i++) {
        if (locations[i].visible) {
            locations[i].marker.setAnimation(google.maps.Animation.DROP);
            locations[i].marker.setVisible(true);
            // Extend the boundaries of the map for each marker
            bounds.extend(locations[i].marker.position);
        } else {
            locations[i].marker.setVisible(false);
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
}

// Create html infowindow to display when a marker or list item is clicked
function populateInfoWindow(marker, infoWindow) {
    if (infoWindow.marker !== marker) {
        getFourSquareData(marker);
        infoWindow.marker = marker;
        infoWindow.setContent('<div class="title">' + marker.title + '</div>');
        infoWindow.open(map, marker);
        infoWindow.addListener('closeclick', function () {
            infoWindow.marker = null;
        });
    }
}

function getFourSquareData(marker) {
    var lat = marker.getPosition().lat();
    var lng = marker.getPosition().lng();
    var searchRadius = 250;
    var todaysDate = getFormattedDate();
    var markerData = {};

    var fourSquareUrl = 'https://api.foursquare.com/v2/venues/search?ll=' + lat + ',' + lng + '&client_id=MWZFALHGOUCNBUJOFJDZ1VLQHZ51SERIIABSE44FWSM1URMK&client_secret=Y4K1HTBUX2KTHTDX0T3Q1KASCBONUU0CBVYIC220IRUBUDJJ&v=' + todaysDate + '&radius=' + searchRadius + '&query=' + marker.title + '&limit=1';

    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function () {
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
            (dd > 9 ? '' : '0') + dd
        ].join('');
    }

    function displayData() {
        var msg = '<div class="title">' + marker.title + '</div><div id="infoWinData">';
        if (markerData.errorMsg) {
            msg += markerData.errorMsg;
        } else {
            if (markerData.address) {
                msg += '<div>' + marker.address + '</div>';
            }
            if (markerData.cityState) {
                msg += '<div>' + marker.cityState + '</div>';
            }
            if (markerData.phone) {
                msg += '<div>' + marker.phone + '</div>';
            }
            if (markerData.website) {
                msg += '<div><a href="' + markerData.website + '" target="_blank">website</a></div>';
            }

            msg += '<a class="attribution" href="http://foursquare.com">Data by Foursquare</a>';
        }
        msg += '</div>';
        largeInfoWindow.setContent(msg);
    }
}

function mapError() {
    alert("An error occurred loading Google Maps. Try again later.")
}

var viewModel = new ViewModel();
ko.applyBindings(viewModel);
