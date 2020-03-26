import _ from "underscore";
import { ComponentType } from "./common/component_types";
import { EntityManager } from "./entity_manager";
import { BLOCK_SZ } from "./common/constants";
import { Span, Span2d } from "./common/span";
import { ServerSpatialSystem } from "./spatial_system";
import { AgentSystem } from "./agent_system";
import { BehaviourSystem } from "./common/behaviour_system";
import { InventorySystem } from "./inventory_system";
import { EntityType } from "./common/game_objects";
import { MapData, Span2dDesc, EntityDesc } from "./common/map_data";
import { ServerEntityFactory } from "./entity_factory";
import { AdvertSystem } from "./advert_system";
import { Pinata } from "./pinata";
import { Logger } from "./logger";

export class MapLoader {
  private _em: EntityManager;
  private _pinata: Pinata;
  private _factory: ServerEntityFactory;
  private _logger: Logger;
  private _mapData: MapData|null = null;

  constructor(em: EntityManager,
              pinata: Pinata,
              factory: ServerEntityFactory,
              logger: Logger) {
    this._em = em;
    this._pinata = pinata;
    this._factory = factory;
    this._logger = logger;
  }

  loadMap(pinata: Pinata) {
    this._mapData = this._loadMapData();

    const gravRegion = this._constructGravRegion(this._mapData.gravityRegion);

    const serverSpatialSystem = new ServerSpatialSystem(this._em,
                                                        this._mapData.width,
                                                        this._mapData.height,
                                                        gravRegion,
                                                        this._logger);
    const agentSystem = new AgentSystem(this._em, this._pinata);
    const behaviourSystem = new BehaviourSystem();
    const inventorySystem = new InventorySystem();
    const adSystem = new AdvertSystem(pinata);

    this._em.addSystem(ComponentType.SPATIAL, serverSpatialSystem);
    this._em.addSystem(ComponentType.AGENT, agentSystem);
    this._em.addSystem(ComponentType.BEHAVIOUR, behaviourSystem);
    this._em.addSystem(ComponentType.INVENTORY, inventorySystem);
    this._em.addSystem(ComponentType.AD, adSystem);

    for (const entity of this._mapData.entities) {
      this._factory.constructEntity(entity);
    }
  }

  get mapData() {
    return this._mapData;
  }

  // TODO: This will come from JSON. For now, generate the data here
  private _loadMapData(): MapData {
    const WORLD_W = 40;
    const WORLD_H = 25;

    const gravRegion: Span2dDesc = [
      [{ a: 0, b: WORLD_W - 1 }],
      [{ a: 0, b: WORLD_W - 1 }],
      [{ a: 0, b: WORLD_W - 1 }],
      [{ a: 0, b: WORLD_W - 1 }],
      [{ a: 0, b: WORLD_W - 1 }],
      [],
      [],
      [],
      [],
      [],
      [],
      [{ a: 6, b: 18 }],
      [{ a: 6, b: 18 }],
      [{ a: 6, b: 18 }],
      [{ a: 6, b: 18 }],
      [{ a: 6, b: 18 }],
    ];

    const entities: EntityDesc[] = [];

    const gr = this._constructGravRegion(gravRegion);
    const numRocks = 20;
    const numGems = 10;

    const trophyCoords = { x: 5, y: 10 };

    let coords: [number, number][] = [];
    for (let c = 0; c < WORLD_W; ++c) {
      for (let r = 0; r < WORLD_H; ++r) {
        if (c === 0 && r === WORLD_H - 1) {
          continue;
        }
        if (c === trophyCoords.x && r === trophyCoords.y) {
          continue;
        }
        if (gr.contains(c, r)) {
          continue;
        }
        coords.push([c * BLOCK_SZ, r * BLOCK_SZ]);
      }
    }

    coords = _.shuffle(coords);

    let idx = 0;
    const rockCoords = coords.slice(0, numRocks);
    idx += numRocks;
    const gemCoords = coords.slice(idx, idx + numGems);
    idx += numGems;
    const soilCoords = coords.slice(idx);

    rockCoords.forEach(([c, r]) => {
      entities.push({
        type: EntityType.ROCK,
        data: {
          y: r,
          x: c
        }
      });
    });

    gemCoords.forEach(([c, r]) => {
      entities.push({
        type: EntityType.GEM,
        data: {
          y: r,
          x: c
        }
      });
    });

    soilCoords.forEach(([c, r]) => {
      entities.push({
        type: EntityType.SOIL,
        data: {
          y: r,
          x: c
        }
      });
    });

    entities.push({
      type: EntityType.BLIMP,
      data: {
        x: 20,
        y: 20
      }
    });

    entities.push({
      type: EntityType.AD,
      data: {
        x: 80,
        y: 40,
        adName: "blimp"
      }
    });

    entities.push({
      type: EntityType.PARALLAX_SPRITE,
      data: {
        width: 1000,
        height: 800,
        centre: {
          x: BLOCK_SZ * (6 + (19 - 6) / 2),
          y: BLOCK_SZ * (11 + (16 - 11) / 2)
        },
        image: "cave.png",
        depth: 2
      }
    });

    entities.push({
      type: EntityType.TROPHY,
      data: {
        x: trophyCoords.x * BLOCK_SZ,
        y: trophyCoords.y * BLOCK_SZ
      }
    });

    return {
      width: WORLD_W,
      height: WORLD_H,
      gravityRegion: gravRegion,
      spawnPoint: { x: 0, y: WORLD_H - 1 },
      entities
    };
  }

  private _constructGravRegion(desc: Span2dDesc) {
    const gravRegion = new Span2d();

    for (let row = 0; row < desc.length; ++row) {
      for (const spanDesc of desc[row]) {
        gravRegion.addHorizontalSpan(row, new Span(spanDesc.a, spanDesc.b));
      }
    }

    return gravRegion;
  }
}
