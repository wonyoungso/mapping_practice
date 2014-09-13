LOGPRESSO.models.MapWidget = (function(){
  function MapWidget(params){

    this.config = params.config;
    this.container = params.container;
    this.projector;
    this.raycaster;
    this.geography_data = null;
    this.geography_mesh = null;
    this.scene;
    this.marker = null;
    this.completeLoadThreed = false;
    // this.data = null;

    _.extend(this, Backbone.Events);
  
  }

  MapWidget.prototype = {
    init: function(){
      
      this.loadShader();

    },

    loadShader: function(){
      if (_.isUndefined(LOGPRESSO.constants.ShaderLoader)){
        LOGPRESSO.constants.ShaderLoader = new LOGPRESSO.models.ShaderLoader({
          shader_list: ['/assets/basic_line', '/assets/basic_color', '/assets/basic_marker', '/assets/basic_sprite']
        });  
      
        LOGPRESSO.constants.ShaderLoader.on('load_complete', _.bind(function(e){
          this.loadGeoJSON();        
        }, this));

        LOGPRESSO.constants.ShaderLoader.load();
      } else {
        this.loadGeoJSON();
      }
      
      
    }, 

    setData: function(_data){
      this.data = _data;
      this.syncData();
    },

    syncData: function(){

      if (this.config.type == 'marker') {
        this.marker = new LOGPRESSO.models.Marker({
          marker_data: this.data
        });

        this.marker.init();
        this.scene.add(this.marker.point_cloud);
        console.info("point cloud added");
      } else { // area
        this.init_chelopleth();
      }
    },

    init_chelopleth: function(){
      var colors = [
        // new THREE.Color("rgb(247,251,255)"),
        new THREE.Color("rgb(222,235,247)"),
        new THREE.Color("rgb(198,219,239)"),
        new THREE.Color("rgb(158,202,225)"),
        new THREE.Color("rgb(107,174,214)"),
        new THREE.Color("rgb(66,146,198)"),
        new THREE.Color("rgb(33,113,181)"),
        new THREE.Color("rgb(8,81,156)"),
        new THREE.Color("rgb(8,48,107)")
      ];


      var quantize = d3.scale.quantize()
                              .domain([0, d3.max(this.data.features, function(f){ return f.properties.value; })])
                              .range(d3.range(colors.length));

      _.each(this.data.features, _.bind(function(feature){
        var countries, geometry_center = new THREE.Vector3();

        if (_.isString(feature.properties["code"])){
          countries = this.geography_mesh.find_country_by_iso_a3(feature.properties["code"]);
        } else {
          countries = this.geography_mesh.find_country_by_local_code(feature.properties["code"]);
        }
        
        

        

        _.each(countries, function(country){
          country.change_color(colors[quantize(feature.properties.value)]);
          geometry_center.copy(country.geometry.boundingBox.center());
        });

        //  var label = new WY.models.CountryLabel({
        //   name: feature.properties.value
        // });

        // label.init();
        // label.position.copy(geometry_center);
        // scene.add(label);

      }, this));
    },

    updateConfig: function(config){
      this.config = config;
      this.loadGeoJSON();
    },

    loadGeoJSON: function(){
      var map_name = '';

      if (this.config.map == 'world') {
        // 세계 맵 로드 
        map_name = 'world.json';
      } else if (this.config.map == 'local'){
        // 국내 맵 설정일 경우 
        map_name = 'local';

        if (this.config.unit == '전국') {
          // 전국을 다 보여줌 
          map_name += '_country';

          switch(this.config.complexity) {
            // complexity를 정함, 전국은 시/군/구 아래 없음
            case "광역시/도":
              map_name += "_complexity_1.json"
              break;
            case "시/군/구":
              map_name += "_complexity_2.json"
              break;
            default:
              map_name += "_complexity_1.json"
              break;
          };
        } else if (this.config.unit == '특정시도') {

          map_name += '_' + this.config.code;

          switch(this.config.complexity) {
            // complexity를 정함 
            case "시/군/구":
              map_name += "_complexity_2.json"
              break;
            case "동/읍/면":
              map_name += "_complexity_3.json"
              break;
            default: 
              map_name += "_complexity_2.json"
              break;
          };


        }
      }
    


      $.ajax({
        url: '/assets/' + map_name,
        type: 'GET',
        success: _.bind(function(data){
          this.geography_data = data;
          
          if (!this.completeLoadThreed) {
            this.init_threed();
            this.animate();
          }

          this.reset_geography();
          this.init_geography();

        }, this)
      })
    },

    reset_geography: function(){
      if (!_.isUndefined(this.geography_mesh)){
        this.scene.remove(this.geography_mesh);
        this.geography_mesh = undefined;
      }

      if (!_.isNull(this.marker)){
        this.scene.remove(this.marker.point_cloud);
        this.marker = null;
        this.data = undefined;
      }
    },

    init_geography: function(){
      
      this.geography_mesh = new LOGPRESSO.models.GeoJSONCountries({
        geojson: this.geography_data,
        type: this.config.type == 'marker' ? "line" : "mesh"
      });

      this.geography_mesh.init();
      this.scene.add(this.geography_mesh);
      console.info("geography mesh added");


      this.geography_mesh.set_bounding_box();

      this.controls.lookAtBoundingBox(this.geography_mesh.boundingBox);


      this.trigger('init_geography_complete', {target: this});
    },

    init_threed: function(){
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

      var devicePixelRatio = window.devicePixelRatio || 1;
      var screen_width = $(window).width()-5;
      var screen_height = $(window).height()-5;

      this.renderer.setSize(screen_width, screen_height);
      // renderer.setViewport(0, 0, screen_width * devicePixelRatio, screen_height * devicePixelRatio);

      $(this.renderer.domElement).width(screen_width);
      $(this.renderer.domElement).height(screen_height);

      this.renderer.autoClear = true;
      this.renderer.sortObjects = false;
      this.renderer.generateMipmaps = false;

      this.container.append($(this.renderer.domElement));

      this.renderer.setClearColor(0x303030, 1);
      this.renderer.clear();

      this.scene = new THREE.Scene();

      this.camera = new THREE.PerspectiveCamera(
        45, window.innerWidth / window.innerHeight, 0.000001, 1000000
      );

      this.camera.position.x = 4;
      this.camera.position.y = 25;
      this.camera.position.z = 300;

      this.controls = new THREE.TrackballControls( this.camera, this.renderer.domElement, new THREE.Vector3().set(4, 25, 0));

      this.controls.rotateSpeed = 1.0;
      this.controls.zoomSpeed = 1.2;
      this.controls.panSpeed = 0.8;

      this.controls.noZoom = false;
      this.controls.noPan = false;

      this.controls.staticMoving = true;
      this.controls.dynamicDampingFactor = 0.3;
      this.controls.noRotate = true;

      
      
      this.projector = new THREE.Projector();
      this.raycaster = new THREE.Raycaster();

      this.completeLoadThreed = true;
      this.trigger('threed_load_complete', {target: this});
    },

    animate: function(){
      requestAnimationFrame(_.bind(this.animate, this));
      this.renderer.render(this.scene, this.camera);
      this.controls.update();
    }
  }

  return MapWidget;
})();
