(function () {
  function NDMAPKIT(addr) {}

  NDMAPKIT.prototype = {
    //初始化地球
    globe_init: function (containerID, cb) {
      //定位中国
      Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(
        90,
        -20,
        110,
        90
      );
      Cesium.Ion.defaultAccessToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhZmM5ODNkYy0yMTIzLTQxNzktOTE1Yy1mN2QxNmFkMjgyMTUiLCJpZCI6Mjk0NzIsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1OTIyMjkxMTJ9.9oYggi4kZgcapD2BkEGF8kG8tTuVkF33FdwxB2JKXeA";
      var viewer = new Cesium.Viewer(containerID, {
        animation: false, //是否显示动画控件
        baseLayerPicker: true, //是否显示图层选择控件
        geocoder: true, //是否显示地名查找控件
        timeline: false, //是否显示时间线控件
        sceneModePicker: true, //是否显示投影方式控件
        navigationHelpButton: false, //是否显示帮助信息控件
        infoBox: false, //是否显示点击要素之后显示的信息
        terrainProvider: Cesium.createWorldTerrain(),
        imageryProvider: new Cesium.TileMapServiceImageryProvider({
          url: Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII"),
        }),
      });
      //去掉版权信息
      viewer._cesiumWidget._creditContainer.style.display = "none";
      // 倾斜视图 鼠标右键旋转
      viewer.scene.screenSpaceCameraController.tiltEventTypes = [
        Cesium.CameraEventType.RIGHT_DRAG,
        Cesium.CameraEventType.PINCH,
      ];
      // 缩放设置 重新设置缩放成员
      viewer.scene.screenSpaceCameraController.zoomEventTypes = [
        Cesium.CameraEventType.MIDDLE_DRAG,
        Cesium.CameraEventType.WHEEL,
        Cesium.CameraEventType.PINCH,
      ];
      var google = new Cesium.UrlTemplateImageryProvider({
        url: "http://mt0.google.cn/vt/lyrs=s&hl=zh-CN&x={x}&y={y}&z={z}",
        tilingScheme: new Cesium.WebMercatorTilingScheme(),
        maximumLevel: 20,
        name: "google",
      });
      viewer.imageryLayers.addImageryProvider(google);
      cb(viewer);
    },
    //屏幕坐标转经纬度
    screen_2_location: function (viewer, movement) {
      var pick1 = new Cesium.Cartesian2(
        movement.position.x,
        movement.position.y
      );
      var cartesian = viewer.scene.globe.pick(
        viewer.camera.getPickRay(pick1),
        viewer.scene
      );
      var ellipsoid = viewer.scene.globe.ellipsoid;
      var cartesian3 = new Cesium.Cartesian3(
        cartesian.x,
        cartesian.y,
        cartesian.z
      );
      var cartographic = ellipsoid.cartesianToCartographic(cartesian3);
      var lat = Cesium.Math.toDegrees(cartographic.latitude);
      var lng = Cesium.Math.toDegrees(cartographic.longitude);
      var alt = cartographic.height;
      return {
        lng: lng,
        lat: lat,
        alt: alt,
      };
    },
    /*世界坐标转经纬度*/
    world_2_lng: function (viewer, position) {
      var ellipsoid = viewer.scene.globe.ellipsoid;
      var cartesian3 = new Cesium.Cartesian3(
        position.x,
        position.y,
        position.z
      );
      var cartographic = ellipsoid.cartesianToCartographic(cartesian3);
      var lat = Cesium.Math.toDegrees(cartographic.latitude);
      var lng = Cesium.Math.toDegrees(cartographic.longitude);
      var alt = cartographic.height;
      return {
        lng: lng,
        lat: lat,
        alt: alt,
      };
    },
    //加载tms数据图层，此方法可能存在定位不准的情况，需要手动修改中心点坐标
    load_tms: function (viewer, url, cb, center) {
      var tms = new Cesium.TileMapServiceImageryProvider({
        url: url,
        fileExtension: "png",
        maximumLevel: 21,
        minimumLevel: 15,
      });
      let a = viewer.imageryLayers.addImageryProvider(tms);
      let destination = a._rectangle;
      if (center != undefined) {
        destination = Cesium.Cartesian3.fromDegrees(
          center.lng,
          center.lat,
          center.alt
        );
        viewer.scene.camera.flyTo({
          destination: destination,
          duration: 2,
        });
      } else {
        viewer.flyTo(a, {
          duration: 2,
        });
      }
      cb(destination);
    },
    //渲染一个图标
    render_billboard: function (viewer, position, options, cb) {
      // 添加广告牌实体
      let p = Cesium.Cartesian3.fromDegrees(
        position.lng,
        position.lat,
        position.alt
      );
      let enetity = viewer.entities.add({
        name: options.name,
        id: options.id,
        position: p,
        label: {
          text: options.name,
          //标注文字描述
          font: "34px NSimSun",
          //"32px Microsoft YaHei" 标注文字大小类型
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 3,
          translucencyByDistance: new Cesium.NearFarScalar(
            1.5e2,
            1.0,
            1.5e5,
            0.0
          ),
          horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
          pixelOffset: new Cesium.Cartesian2(25, -45),
          disableDepthTestDistance: 1000000000,
          //标注的遮挡距离设置为100则视角与标注的距离大于100米时会有遮挡
          scale: 0.5,
        },
        billboard: {
          image: options.icon,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          scale: 1,
        },
      });
      cb(enetity);
    },
    //获取当前视角的高度
    getHeight: function (viewer, cb) {
      var height = false;
      if (viewer) {
        var scene = viewer.scene;
        var ellipsoid = scene.globe.ellipsoid;
        height = ellipsoid.cartesianToCartographic(viewer.camera.position)
          .height;
      }
      cb(height);
    },
    //设置视角的最大高度
    maximumZoomDistance: function (viewer, distance) {
      viewer.scene.screenSpaceCameraController.maximumZoomDistance = distance;
    },
    //设置视角的最小高度
    minimumZoomDistance: function (viewer, distance) {
      viewer.scene.screenSpaceCameraController.maximumZoomDistance = distance;
    },
    //如果浏览器报错了khr，则在初始化地球之前，线调用此方法
    fix_khr_init: function () {
      var fixGltf = function (gltf) {
        if (!gltf.extensionsUsed) {
          return;
        }
        var v = gltf.extensionsUsed.indexOf("KHR_technique_webgl");
        var t = gltf.extensionsRequired.indexOf("KHR_technique_webgl");
        // 中招了。。
        if (v !== -1) {
          gltf.extensionsRequired.splice(t, 1, "KHR_techniques_webgl");
          gltf.extensionsUsed.splice(v, 1, "KHR_techniques_webgl");
          gltf.extensions = gltf.extensions || {};
          gltf.extensions["KHR_techniques_webgl"] = {};
          gltf.extensions["KHR_techniques_webgl"].programs = gltf.programs;
          gltf.extensions["KHR_techniques_webgl"].shaders = gltf.shaders;
          gltf.extensions["KHR_techniques_webgl"].techniques = gltf.techniques;
          var techniques = gltf.extensions["KHR_techniques_webgl"].techniques;

          gltf.materials.forEach(function (mat, index) {
            gltf.materials[index].extensions["KHR_technique_webgl"].values =
              gltf.materials[index].values;
            gltf.materials[index].extensions["KHR_techniques_webgl"] =
              gltf.materials[index].extensions["KHR_technique_webgl"];

            var vtxfMaterialExtension =
              gltf.materials[index].extensions["KHR_techniques_webgl"];

            for (var value in vtxfMaterialExtension.values) {
              var us = techniques[vtxfMaterialExtension.technique].uniforms;
              for (var key in us) {
                if (us[key] === value) {
                  vtxfMaterialExtension.values[key] =
                    vtxfMaterialExtension.values[value];
                  delete vtxfMaterialExtension.values[value];
                  break;
                }
              }
            }
          });

          techniques.forEach(function (t) {
            for (var attribute in t.attributes) {
              var name = t.attributes[attribute];
              t.attributes[attribute] = t.parameters[name];
            }

            for (var uniform in t.uniforms) {
              var name = t.uniforms[uniform];
              t.uniforms[uniform] = t.parameters[name];
            }
          });
        }
      };
      Object.defineProperties(Cesium.Model.prototype, {
        _cachedGltf: {
          set: function (value) {
            this._vtxf_cachedGltf = value;
            if (this._vtxf_cachedGltf && this._vtxf_cachedGltf._gltf) {
              fixGltf(this._vtxf_cachedGltf._gltf);
            }
          },
          get: function () {
            return this._vtxf_cachedGltf;
          },
        },
      });
    },
    //加载三维模型
    load_3dTiles: function (viewer, url, cb, option) {
      let maximumScreenSpaceError = 16;
      if (option != undefined) {
        option.hasOwnProperty("display")
          ? (maximumScreenSpaceError = option.display)
          : 16;
      }

      let tileset = new Cesium.Cesium3DTileset({
        url: url,
        maximumScreenSpaceError: maximumScreenSpaceError,
      });
      tileset.readyPromise
        .then(function (tile) {
          viewer.scene.primitives.add(tile);
          NDMAPKIT.prototype.flyTo_target(viewer, tileset, {});
          cb(tileset);
        })
        .otherwise(function (error) {
          cb(error);
        });
    },
    //调整模型高度
    changeHeight: function (tileset, height) {
      height = Number(height);
      if (isNaN(height)) {
        return;
      }
      var cartographic = Cesium.Cartographic.fromCartesian(
        tileset.boundingSphere.center
      );
      var surface = Cesium.Cartesian3.fromRadians(
        cartographic.longitude,
        cartographic.latitude,
        cartographic.height
      );
      var offset = Cesium.Cartesian3.fromRadians(
        cartographic.longitude,
        cartographic.latitude,
        height
      );
      var translation = Cesium.Cartesian3.subtract(
        offset,
        surface,
        new Cesium.Cartesian3()
      );
      tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
    },
    /*获取三维点*/
    get_3d_point: function (viewer, cb, tooltip) {
      if (tooltip != undefined) {
        tooltip = document.getElementById(tooltip);
        tooltip.style.display = "block";
      }
      var handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
      handler.setInputAction(function (movement) {
        if (tooltip != undefined) {
          tooltip.style.display = "none";
        }
        let cartesian = viewer.scene.pickPosition(movement.position);
        cartesian = NDMAPKIT.prototype.world_2_lng(viewer, cartesian);
        handler.destroy(); //关闭事件句柄
        cb(cartesian);
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      handler.setInputAction(function (movement) {
        if (tooltip != undefined) {
          tooltip.style.display = "none";
        }
        handler.destroy(); //关闭事件句柄
        cb(false);
      }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    },
    //获取二维点
    get_2d_point: function (viewer, cb, tooltip) {
      if (tooltip != undefined) {
        tooltip = document.getElementById(tooltip);
        tooltip.style.display = "block";
      }

      var handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
      //左键点击事件
      handler.setInputAction(function (movement) {
        if (tooltip != undefined) {
          tooltip.style.display = "none";
        }
        let location = NDMAPKIT.prototype.screen_2_location(viewer, movement);
        handler.destroy(); //关闭事件句柄
        cb(location);
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      //右键取消事件
      handler.setInputAction(function (movement) {
        if (tooltip != undefined) {
          tooltip.style.display = "none";
        }
        handler.destroy(); //关闭事件句柄
        cb(false);
      }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

      //鼠标移动事件
      handler.setInputAction(function (movement) {
        if (tooltip != undefined) {
          tooltip.style.left = movement.endPosition.x + 5 + "px";
          tooltip.style.top = movement.endPosition.y + 5 + "px";
          tooltip.innerHTML = '<p style="color: gold">左击添加，右击取消</p>';
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    },
    //定位到目标
    flyTo_target: function (viewer, target, option) {
      let duration = option.hasOwnProperty("duration") ? option.duration : 3;
      let heading = option.hasOwnProperty("heading")
        ? Cesium.Math.toRadians(option.heading)
        : Cesium.Math.toRadians(0);
      let pitch = option.hasOwnProperty("pitch")
        ? Cesium.Math.toRadians(option.pitch)
        : Cesium.Math.toRadians(-50);
      let range = option.hasOwnProperty("range")
        ? Cesium.Math.toRadians(option.range)
        : Cesium.Math.toRadians(0);
      viewer.flyTo(target, {
        duration: duration,
        offset: new Cesium.HeadingPitchRange(heading, pitch, range),
      });
    },
    //注册鼠标左键点击事件，若点击处存在标注，则返回标注的ID，若不存在，则返回null
    reg_mouse_click: function (viewer, cb) {
      var handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
      //左键点击事件
      handler.setInputAction(function (movement) {
        var pick = viewer.scene.pick(movement.position);
        if (pick != undefined && !pick.hasOwnProperty("__ob__")) {
          cb(pick.id._id);
        } else cb(null);
      }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    },
    //绘制管道线
    render_pipeline: function (viewer, positions, options, cb) {
      let array = [];
      positions.forEach(function (item) {
        array.push(item.lng);
        array.push(item.lat);
        array.push(item.alt);
      });
      var pipeline = viewer.entities.add({
        polylineVolume: {
          positions: Cesium.Cartesian3.fromDegreesArrayHeights(array),
          // positions: Cesium.Cartesian3.fromDegreesArray(array),
          shape: NDMAPKIT.prototype.computeCircle(options.radius),
          material: options.color,
        },
      });
      cb(pipeline);
    },
    //计算管道粗细
    computeCircle: function (radius) {
      var positions = [];
      for (var i = 0; i < 360; i++) {
        var radians = Cesium.Math.toRadians(i);
        positions.push(
          new Cesium.Cartesian2(
            radius * Math.cos(radians),
            radius * Math.sin(radians)
          )
        );
      }
      return positions;
    },
    //动态绘制管道线
    draw_pipeline: function (viewer, options, cb) {
      var handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
      let positions = [];

      let temLine = null; //临时线
      let timer = 0;
      let real = null;
      handler.setInputAction(function (movement) {
        //let location = NDMAPKIT.prototype.screen_2_location(viewer,movement);
        let cartesian = viewer.scene.pickPosition(movement.position);
        let location = NDMAPKIT.prototype.world_2_lng(viewer, cartesian);
        positions.push(location);

        if (positions.length > 1) {
          //开始绘制
          viewer.entities.remove(real);
          real = null;
          NDMAPKIT.prototype.render_pipeline(
            viewer,
            positions,
            options,
            function (pipeline) {
              real = pipeline;
            }
          );
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK); //左键点击

      handler.setInputAction(function (movement) {
        movement = {
          position: { x: movement.endPosition.x, y: movement.endPosition.y },
        };

        // let location = NDMAPKIT.prototype.screen_2_location(viewer,movement);
        let cartesian = viewer.scene.pickPosition(movement.position);
        let location = NDMAPKIT.prototype.world_2_lng(viewer, cartesian);

        timer++;
        if (positions.length > 0) {
          //开始绘制
          if (temLine != null)
            //清除临时线
            viewer.entities.remove(temLine);
          timer = 0;
          let arr = [positions[positions.length - 1], location];
          NDMAPKIT.prototype.render_pipeline(
            viewer,
            arr,
            options,
            function (pipeline) {
              temLine = pipeline;
            }
          );
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE); //鼠标移动

      handler.setInputAction(function (movement) {
        cb(positions, real);
        if (temLine != null)
          //清除临时线
          viewer.entities.remove(temLine);
        handler.destroy();
      }, Cesium.ScreenSpaceEventType.RIGHT_CLICK); //右键点击
    },
  };

  window.NDMAPKIT = NDMAPKIT;
})();
