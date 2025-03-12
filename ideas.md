# feature ideas

- place an image on the screen
- put pins in the image
- display the image with all the pins
- download the image with all the pins
- owner of the image can choose to allow others to pin or not
- owner can set the image with upload 
- owner can set the image of the pin 
- owner can set a label at the top of or over the image
- owner can set up a legend, so different color pins can mean different things.

- Out of the box: Pin the Tail on the Donkey
- Out of the box: put pins on a map  

# Use cases:
 - a tour guide can put up a map of a city and place pins in the places they will take customers to
 - a photographer can put up a map of a city with pins in places they recommend for great shots.  There can be color coded for morning and evening
 - A world traveler can mark the places where they've visited, and want to visit
 - A conference can put up a map to let attendees mark where they are coming from.  


# Technical Details
## Stack
- Backend: Node.js (>=20.0.0) with Express
- Frontend: Vanilla JavaScript (ES6+)
- Container: Docker with multi-stage builds
- Security: Express security middleware
- Storage: File-based with auto-save
- Theme: Dynamic dark/light mode with system preference support
## Dependencies
- express: Web framework
- cors: Cross-origin resource sharing
- dotenv: Environment configuration
- cookie-parser: Cookie handling
- express-rate-limit: Rate limiting