<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0"
  xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd"
  xmlns="http://www.opengis.net/sld"
  xmlns:ogc="http://www.opengis.net/ogc"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">

  <NamedLayer>
    <Name>parada_condicional</Name>
    <UserStyle>
      <Title>Paradas con estilo condicional</Title>
      <FeatureTypeStyle>
        
        <!-- Regla para paradas habilitadas (estado = 0) -->
        <Rule>
          <Name>Paradas Habilitadas</Name>
          <Title>Paradas Habilitadas</Title>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>habilitada</ogc:PropertyName>
              <ogc:Literal>1</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <ExternalGraphic>
                <OnlineResource xlink:href="file:/opt/geoserver/data_dir/styles/parada.png" xlink:type="simple"/>
                <Format>image/png</Format>
              </ExternalGraphic>
              <Size>24</Size>
            </Graphic>
          </PointSymbolizer>
        </Rule>
        
        <!-- Regla para paradas deshabilitadas (estado = 1) -->
        <Rule>
          <Name>Paradas Deshabilitadas</Name>
          <Title>Paradas Deshabilitadas</Title>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>habilitada</ogc:PropertyName>
              <ogc:Literal>0</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <PointSymbolizer>
            <Graphic>
              <ExternalGraphic>
                <OnlineResource xlink:href="file:/opt/geoserver/data_dir/styles/parada_deshabilitada.png" xlink:type="simple"/>
                <Format>image/png</Format>
              </ExternalGraphic>
              <Size>24</Size>
            </Graphic>
          </PointSymbolizer>
        </Rule>
        
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>