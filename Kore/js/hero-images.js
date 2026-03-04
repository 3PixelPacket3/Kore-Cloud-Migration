// Kore hero image loader
// Allows pages to specify a hero <img> by id and a base filename,
// and it will try .png, .jpg, and .jpeg in that order.
(function () {
  function loadHeroImage(elementId, baseName) {
    var img = document.getElementById(elementId);
    if (!img) return;

    var candidates = [
      "images/" + baseName + ".png",
      "images/" + baseName + ".jpg",
      "images/" + baseName + ".jpeg"
    ];
    var index = 0;

    function tryNext() {
      if (index >= candidates.length) {
        // Give up and hide if nothing loads
        img.style.display = "none";
        return;
      }
      img.src = candidates[index];
      index++;
    }

    img.onload = function () {
      img.style.display = "block";
    };

    img.onerror = function () {
      tryNext();
    };

    // Start the chain
    tryNext();
  }

  // Expose globally
  window.KoreHero = {
    loadHeroImage: loadHeroImage
  };
})();
