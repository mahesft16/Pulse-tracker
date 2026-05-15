/**
 * PulseTrack - Map and Geolocation Management
 * Uses Leaflet.js for rendering and the HTML5 Geolocation API.
 */

class MapNavigator {
    constructor(containerId) {
        this.containerId = containerId;
        this.map = null;
        this.userMarker = null;
        this.pathLine = null;
        this.pathCoordinates = [];
        this.watchId = null;
        this.isSharing = false;
        this.totalDistanceKm = 0;
        this.onDistanceUpdate = null; // Callback for app.js
        
        // Custom icon for user location
        this.customIcon = L.divIcon({
            className: 'custom-div-icon',
            html: "<div style='background-color: #22c55e; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(34,197,94,0.8);'></div>",
            iconSize: [22, 22],
            iconAnchor: [11, 11]
        });
    }

    init() {
        // Initialize map centered at a default location (will update immediately if location granted)
        this.map = L.map(this.containerId, {
            zoomControl: false // Hide default zoom for cleaner UI
        }).setView([0, 0], 2);

        // Add Dark Theme Map Tiles (CartoDB Dark Matter)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(this.map);
        
        // Add Path Polyline
        this.pathLine = L.polyline([], {
            color: '#3b82f6',
            weight: 4,
            opacity: 0.8,
            smoothFactor: 1
        }).addTo(this.map);
    }

    startTracking() {
        if (!navigator.geolocation) {
            console.error("Geolocation is not supported by this browser.");
            return;
        }

        // Get initial position quickly
        navigator.geolocation.getCurrentPosition(
            (pos) => this.updatePosition(pos, true),
            (err) => console.warn(`ERROR(${err.code}): ${err.message}`),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );

        // Start watching position
        this.watchId = navigator.geolocation.watchPosition(
            (pos) => this.updatePosition(pos, false),
            (err) => console.warn(`Watch ERROR(${err.code}): ${err.message}`),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }

    stopTracking() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        this.totalDistanceKm = 0;
        this.pathCoordinates = [];
        if (this.pathLine) this.pathLine.setLatLngs([]);
    }

    // Haversine formula to calculate distance between two lat/lng points in km
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        return R * c; // Distance in km
    }

    updatePosition(position, firstLoad = false) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const latLng = [lat, lng];

        // Update Path & Distance
        if (this.pathCoordinates.length > 0 && !firstLoad) {
            const lastPos = this.pathCoordinates[this.pathCoordinates.length - 1];
            const dist = this.calculateDistance(lastPos[0], lastPos[1], lat, lng);
            // Only add if movement is significant (> 1 meter) to filter GPS jitter
            if (dist > 0.001) {
                this.totalDistanceKm += dist;
                this.pathCoordinates.push(latLng);
                this.pathLine.setLatLngs(this.pathCoordinates);
                if (this.onDistanceUpdate) this.onDistanceUpdate(this.totalDistanceKm);
            }
        } else {
            this.pathCoordinates.push(latLng);
            this.pathLine.setLatLngs(this.pathCoordinates);
        }

        // Update Marker
        if (!this.userMarker) {
            this.userMarker = L.marker(latLng, { icon: this.customIcon }).addTo(this.map);
        } else {
            this.userMarker.setLatLng(latLng);
        }

        // Pan map
        if (firstLoad || this.isSharing) {
            this.map.setView(latLng, 16, { animate: true });
        }
    }

    async toggleLiveShare(statusElement) {
        if (!this.isSharing) {
            if (this.pathCoordinates.length === 0) {
                alert("Please click 'Start' to get your GPS location first before sharing.");
                return false;
            }
            
            const lastPos = this.pathCoordinates[this.pathCoordinates.length - 1];
            
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'PulseTrack Location',
                        text: 'Track my workout location!',
                        url: `https://www.google.com/maps/search/?api=1&query=${lastPos[0]},${lastPos[1]}`
                    });
                } catch (e) {
                    console.log('Sharing cancelled');
                }
            } else {
                alert(`Share this link: https://www.google.com/maps/search/?api=1&query=${lastPos[0]},${lastPos[1]}`);
            }

            this.isSharing = true;
            statusElement.classList.remove('hidden');
            this.map.setView(lastPos, 17, { animate: true });
            return true;
        } else {
            this.isSharing = false;
            statusElement.classList.add('hidden');
            return false;
        }
    }
}

window.MapNavigator = MapNavigator;
