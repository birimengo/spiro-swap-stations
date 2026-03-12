export class Station {
  constructor(data) {
    this.name = data.name;
    this.phone = data.phone || "";
    this.latitude = parseFloat(data.latitude);
    this.longitude = parseFloat(data.longitude);
    this.addedBy = data.addedBy;
    this.addedDate = data.addedDate || new Date().toISOString();
    this.reviews = data.reviews || [];
    
    // GeoJSON point for location queries
    this.location = {
      type: "Point",
      coordinates: [this.longitude, this.latitude]
    };
  }

  validate() {
    const errors = [];
    
    if (!this.name) errors.push("Station name is required");
    if (!this.latitude || isNaN(this.latitude)) errors.push("Valid latitude is required");
    if (!this.longitude || isNaN(this.longitude)) errors.push("Valid longitude is required");
    if (!this.addedBy) errors.push("Admin name is required");
    
    return errors;
  }

  toJSON() {
    return {
      name: this.name,
      phone: this.phone,
      latitude: this.latitude,
      longitude: this.longitude,
      addedBy: this.addedBy,
      addedDate: this.addedDate,
      reviews: this.reviews,
      location: this.location
    };
  }
}
