var camera, scnee;
WY.views.practice_08_view = (function(){
  var marker_data,
      world_geojson_data,
      renderer,
      // scene,
      // camera,
      controls,
      projector,
      raycaster,
      tooltip,
      mouse = new THREE.Vector2(), INTERSECTED, CLICK_INTERSECTED, mousedowned = false;
      

  function practice_08_view(){
    load_shader();
  }

  function load_shader(){
    WY.constants.ShaderLoader = new WY.models.ShaderLoader({
      shader_list: ['/assets/basic_line', '/assets/basic_color', '/assets/basic_marker']
    });

    WY.constants.ShaderLoader.on('load_complete', function(e){
      load_marker_data();
    });

    WY.constants.ShaderLoader.load();
  }

  function load_marker_data(){
    $.ajax({
      url: '/assets/marker_sample.json',
      type: 'GET',
      success: function(data){
        marker_data = data;
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

    renderer.setSize(screen_width, screen_height);
    // renderer.setViewport(0, 0, screen_width * devicePixelRatio, screen_height * devicePixelRatio);

    $(renderer.domElement).width(screen_width);
    $(renderer.domElement).height(screen_height);

    renderer.autoClear = true;
    renderer.sortObjects = false;
    renderer.generateMipmaps = false;

    document.getElementById('glContainer').appendChild( renderer.domElement );


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


    controls = new THREE.TrackballControls( camera, renderer.domElement, new THREE.Vector3().set(4, 25, 0));

    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;

    controls.noZoom = false;
    controls.noPan = false;

    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;
    controls.noRotate = true;

    controls.keys = [ 65, 83, 68 ];

    // var korea_countries = new WY.models.GeoJSONCountries({
    //   geojson: korea_geojson_data
    // });

    // korea_countries.init();
    // scene.add(korea_countries.mesh);
    



    var world_countries = new WY.models.GeoJSONCountries({
      geojson: world_geojson_data
    });

    world_countries.init();
    scene.add(world_countries);

    // var marker = new WY.models.Marker({
    //   marker_data: marker_data
    // });
    // marker.init();

    // scene.add(marker.point_cloud);
    
    projector = new THREE.Projector();
    raycaster = new THREE.Raycaster();

    $(renderer.domElement).mousedown(onDocumentMouseDown);

    document.addEventListener( 'mouseup', onDocumentMouseUp, false );
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );

    tooltip = new WY.models.Tooltip();
    tooltip.init();
    tooltip.hide();


  }

  function onDocumentMouseUp(event){
    mousedowned = false;
    if ( CLICK_INTERSECTED ) {

          CLICK_INTERSECTED.set_mouse_out();

        }
        CLICK_INTERSECTED = null;
  }

  function onDocumentMouseMove( event ) {

      event.preventDefault();

      mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
      mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

      tooltip.update(event);

      if (!mousedowned){
       var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
          projector.unprojectVector( vector, camera );

          raycaster.set( camera.position, vector.sub( camera.position ).normalize() );

          var intersects = raycaster.intersectObjects( scene.children, true );

          if ( intersects.length > 0 ) {

            if ( INTERSECTED != intersects[ 0 ].object ) {

              if ( INTERSECTED ) {
                INTERSECTED.set_mouse_out();
              }
              INTERSECTED = intersects[ 0 ].object;
              INTERSECTED.set_mouse_over();
              tooltip.show();
              // console.log("mouse over");

            }

          } else {

            if ( INTERSECTED ) {

              INTERSECTED.set_mouse_out();

            }
            INTERSECTED = null;
            tooltip.hide();
              // console.log("mouse out");
          }
      }
        
  }

  function onDocumentMouseDown( event ) {
      mousedowned = true;
      // event.preventDefault();
      

      mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
      mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;


      var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
      projector.unprojectVector( vector, camera );

      raycaster.set( camera.position, vector.sub( camera.position ).normalize() );

      var intersects = raycaster.intersectObjects( scene.children, true );

      if ( intersects.length > 0 ) {

        if ( CLICK_INTERSECTED != intersects[ 0 ].object ) {

          if ( CLICK_INTERSECTED ) {
            CLICK_INTERSECTED.set_mouse_out();

          }
          CLICK_INTERSECTED = intersects[ 0 ].object;
          CLICK_INTERSECTED.set_mouse_click();
          
          controls.lookAtObject(CLICK_INTERSECTED);
          
        }

      } else {

        if ( CLICK_INTERSECTED ) {

          CLICK_INTERSECTED.set_mouse_out();

        }
        CLICK_INTERSECTED = null;
      }
  }



  function animate(){
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    controls.update();
  }


  return practice_08_view;
})();
