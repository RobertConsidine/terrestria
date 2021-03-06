import { EntityManager, getNextEntityId } from "../entity_manager";
import { EntityId } from "../common/system";
import { FreeModeProperties } from "../free_mode_properties";
import { SpatialSystem } from "../spatial_system";
import { ComponentType } from "../common/component_types";
import { CSpatial } from "../spatial_component";
import { DEFAULT_GRID_MODE_PROPS } from "../grid_mode_properties";
import { SpatialMode } from "../common/spatial_packet";
import { EntityType } from "../common/game_objects";
import { Scheduler } from "../common/scheduler";
import { SERVER_FRAME_DURATION_MS, BLOCK_SZ_WLD } from "../common/constants";

export function constructBlimp(em: EntityManager,
                               desc: any,
                               scheduler: Scheduler,
                               worldW: number): EntityId {
  const id = getNextEntityId();

  const freeModeProps: FreeModeProperties = {
    heavy: false,
    fixedAngle: false,
    bodiless: true
  };

  const spatialSys = <SpatialSystem>em.getSystem(ComponentType.SPATIAL);

  const spatialComp = new CSpatial(id,
                                   false,
                                   spatialSys.grid,
                                   DEFAULT_GRID_MODE_PROPS,
                                   freeModeProps);

  spatialComp.currentMode = SpatialMode.FREE_MODE;

  em.addEntity(id, EntityType.BLIMP, desc, [ spatialComp ]);

  spatialSys.positionEntity(id, desc.x, desc.y);

  const bobble = 10;
  const xOffset = -BLOCK_SZ_WLD * 10;
  const range = (worldW * BLOCK_SZ_WLD) - xOffset;
  const y0 = spatialComp.y;
  const dx = 1;
  const period = 280;

  scheduler.addFunction(() => {
    const x = spatialComp.x_abs + dx;
    const x_ = x % period;
    const xNorm = 2 * Math.PI * x_ / period;
    const yNorm = Math.sin(xNorm);
    const y_ = yNorm * bobble;
    const finalY = y0 + y_;
    const finalX = x;

    if (finalX > range) {
      spatialSys.positionEntity(id, xOffset, finalY, true);
    }
    else {
      spatialSys.positionEntity(id, finalX, finalY, false);
    }
  }, SERVER_FRAME_DURATION_MS, () => em.hasEntity(id));

  return id;
}
