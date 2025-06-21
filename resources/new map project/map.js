  /* global L, topojson */
  (async () => {
    /*──────── CONFIG ────────*/
    const CFG = {
      hoverThrottleMs: 50,
      highlightWeight: 2
    };

    /*──────── inject hover‐label CSS + element ────────*/
    const LABEL = document.createElement('div');
    LABEL.id = 'hoverLabel';
    document.body.appendChild(LABEL);

    /*──────── MAP ────────*/
    const map = L.map('map',{
      minZoom:2,
      preferCanvas:true,
      renderer: L.canvas({ padding:0.5 })
    }).setView([20,0],3);

    /*──────── Styles ────────*/
    const styleProvince = () => ({
      weight:1, color:'#444',
      fill:true, fillColor:'#f8f8f8', fillOpacity:1
    });
    const HL = {
      weight: CFG.highlightWeight,
      color: '#f80',
      fill: true, fillColor: '#ffeb91', fillOpacity: 0.6
    };

    /*──────── Utilities ────────*/
    async function loadGeo(url) {
      const topo = await (await fetch(url)).json();
      const obj  = topo.objects[Object.keys(topo.objects)[0]];
      return topojson.feature(topo, obj);
    }
    function vectorLayer(geo, styleFn) {
      return L.vectorGrid.slicer(geo, {
        rendererFactory: L.canvas.tile,
        interactive: false,
        updateWhileZooming: true,
        updateWhileInteracting: true,
        vectorTileLayerStyles: { sliced: styleFn }
      });
    }
    function svgHitLayer(geo, baseStyle) {
      return L.geoJSON(geo, {
        style: () => ({ ...baseStyle(), opacity:0, fillOpacity:0 }),
        renderer: L.svg(),
        interactive: true
      });
    }

    /*──────── Hover logic ────────*/
    let lastMove = 0, activeName = null;
    function showHover(name, ev) {
      activeName = name || '—';
      LABEL.textContent = activeName;
      LABEL.style.left = ev.clientX + 'px';
      LABEL.style.top  = ev.clientY + 'px';
      LABEL.style.opacity = 1;
    }
    function hideHover() {
      LABEL.style.opacity = 0;
      activeName = null;
    }

    /*──────── MAIN ────────*/
    const geoP  = await loadGeo('data/admin1.topo.json');
    const paint = vectorLayer(geoP, styleProvince);
    const hit   = svgHitLayer(geoP, styleProvince);

    // bind highlight events on the SVG layer
    hit.eachLayer(layer => {
      const props = layer.feature.properties;
      layer.on('mouseover', e => {
        layer.setStyle(HL);
        layer.bringToFront();
        showHover(`${props.name}${props.admin0?`, ${props.admin0}`:''}`, e.originalEvent);
      });
      layer.on('mousemove', e => {
        const now = performance.now();
        if (now - lastMove > CFG.hoverThrottleMs) {
          lastMove = now;
          showHover(activeName, e.originalEvent);
        }
      });
      layer.on('mouseout', () => {
        hit.resetStyle(layer);
        hideHover();
      });
    });

    // add to map
    paint.addTo(map);
    hit  .addTo(map);

    // hide label while dragging
    map.on('movestart', hideHover);
    // keep label following during pan
    map.getContainer().addEventListener('mousemove', ev => {
      if (activeName) showHover(activeName, ev);
    });
  })();