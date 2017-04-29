

function ViewModel() {
    var self = this;

    self.locations = locations;
    self.search = ko.observable("");

    for (var i = 0; i < self.locations.length; i++) {
        self.locations[i].id = i;
        self.locations[i].filtered = ko.observable(true);
    }

    self.results = ko.computed(function() {
        var resultsTotal = 0;
        var filteredIds = [];
        var search = self.search().toLowerCase();
        for (var i = 0; i < self.locations.length; i++) {
            var schoolName = self.locations[i].title.toLowerCase();
            if (schoolName.indexOf(search) >= 0) {
                self.locations[i].filtered(true);
                filteredIds.push(i);
                resultsTotal++;
            } else {
                self.locations[i].filtered(false);
            }
        }

        showMarkers(filteredIds);

        return resultsTotal;
    });

    self.toggleAnimateMarker = function(data, event) {
        var btns = document.getElementsByClassName('marker-btn');

        if (event.target.classList.contains('marker-animating')) {
            event.target.classList.remove('marker-animating');
            bounceMarkerOff(data.id);
        } else {
            for (var i = 0; i < btns.length; i++) {
                btns[i].classList.remove('marker-animating');
            }
            event.target.classList.add('marker-animating');
            bounceMarkerOn(data.id);
        }
    };
}

window.onload = function() {
    initMap();
    ko.applyBindings(new ViewModel());
};


