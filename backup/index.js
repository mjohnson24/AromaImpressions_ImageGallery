// this funciton is called by FileMaker.
window.loadWidget = function (json) {
  const dataElement = document.getElementById("data");
  console.log("loadJSON", json);
  const obj = JSON.parse(json);
  console.log("obj", obj);
  console.log("ServiceID", obj.data[0].ServiceID);

  const ServiceID = obj.data[0].ServiceID;
  const ClientID = obj.data[0].ClientID;
  const PhotoName = obj.data[0].PhotoName;
  const UnitLocation = obj.data[0].UnitLocation;
  const UnitType = obj.data[0].UnitType;
  const UnitSerial = obj.data[0].UnitSerial;
  const Image = obj.data[0].image;

  // 1. Create the image element
  const img = document.createElement("img");

  // 2. Set the image source (and optionally other attributes)
  img.src = `data:image/jpeg;base64,${Image}`;
  img.alt = PhotoName; // Important for accessibility
  img.width = 300; // Optional: set width
  img.height = 200; // Optional: set height

  // 3. Append the image element to a parent element in the DOM
  // For example, appending it to the body:
  dataElement.appendChild(img);
};
