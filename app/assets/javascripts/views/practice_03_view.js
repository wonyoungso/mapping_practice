WY.views.practice_03_view = (function(){
  var korea_geojson_data,
      world_geojson_data,
      renderer,
      scene,
      camera,
      controls;

  function practice_03_view(){
    load_shader();
  }

  function load_shader(){
    WY.constants.ShaderLoader = new WY.models.ShaderLoader({
      shader_list: ['/assets/basic_line', '/assets/basic_color']
    });

    WY.constants.ShaderLoader.on('load_complete', function(e){
      load_geojson_korea();
    });

    WY.constants.ShaderLoader.load();
  }

  function load_geojson_korea(){
    $.ajax({
      url: '/assets/vadm.json',
      type: 'GET',
      success: function(data){
        korea_geojson_data = data;
        load_geojson_world();
      }
    });
  }

  function load_geojson_world(){
    $.ajax({
      url: '/assets/world_countries.json',
      type: 'GET',
      success: function(data){
        world_geojson_data = data;
        init();
        animate();
      }
    })
  }

  function init(){
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    var devicePixelRatio = window.devicePixelRatio || 1;
    var screen_width = $(window).width()-5;
    var screen_height = $(window).height()-5;

    renderer.setSize($(window).width(), $(window).height());
    // renderer.setViewport(0, 0, screen_width * devicePixelRatio, screen_height * devicePixelRatio);

    // $(renderer.domElement).width(screen_width);
    // $(renderer.domElement).height(screen_height);

    renderer.autoClear = true;
    renderer.sortObjects = false;
    renderer.generateMipmaps = false;

    $("body").append($(renderer.domElement));

    renderer.setClearColor(0x000000, 1);
    renderer.clear();

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
      45, window.innerWidth / window.innerHeight, 1, 100000
    );

    camera.position.x = 4;
    camera.position.y = 25;
    camera.position.z = 300;
    // camera.lookAt({x: 15, y: 30, z: 0});


    // controls = new THREE.TrackballControls( camera, renderer.domElement, new THREE.Vector3().set(4, 25, 0));


    var korea_countries = new WY.models.GeoJSONCountries({
      geojson: korea_geojson_data
    });

    korea_countries.init();
    scene.add(korea_countries);
    


    var world_countries = new WY.models.GeoJSONCountries({
      geojson: world_geojson_data
    });

    world_countries.init();
    scene.add(world_countries);
    
     // TweenMax.to(camera.position, 10, {y: "+=3"});

  }

  function animate(){
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    // controls.update();
  }

  return practice_03_view;
})();
