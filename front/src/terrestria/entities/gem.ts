import { EntityManager } from "../entity_manager";
import { EntityData } from "../common/entity_manager";
import { StaticImage, AnimationDesc, CSprite,
         RenderSystem } from "../render_system";
import { PLAYER_SPEED } from "../common/constants";
import { CSpatial } from "../spatial_component";
import { ComponentType } from "../common/component_types";
import { GameEventType, EAgentAction, AgentActionType } from "../common/event";
import { EventHandlerFn, CBehaviour } from "../common/behaviour_system";
import { EntityType } from "../common/game_objects";
import { SpatialSystem } from "../spatial_system";

export function constructGem(em: EntityManager, entity: EntityData) {
  const id = entity.id;

  const staticImages: StaticImage[] = [
    {
      name: "gem.png"
    }
  ];

  const animations: AnimationDesc[] = [
    {
      name: "gem_burn",
      duration: 1.0 / PLAYER_SPEED
    },
    {
      name: "gem_zap",
      duration: 1.0 / PLAYER_SPEED
    }
  ];

  const renderComp = new CSprite(id,
                                 staticImages,
                                 animations,
                                 "gem.png");

  const spatialComp = new CSpatial(id, em);

  const renderSys = <RenderSystem>em.getSystem(ComponentType.RENDER);

  const targetedEvents = new Map<GameEventType, EventHandlerFn>();
  targetedEvents.set(GameEventType.ENTITY_BURNED, e => {
    renderSys.playAnimation(id, "gem_burn", () => {
      em.removeEntity(id);
    });
  });
  targetedEvents.set(GameEventType.AGENT_ACTION, e => {
    const event = <EAgentAction>e;

    if (event.actionType == AgentActionType.COLLECT) {
      renderSys.playAnimation(id, "gem_zap", () => {
        em.removeEntity(id);
      });
    }
  });

  const behaviourComp = new CBehaviour(id, targetedEvents);

  em.addEntity(id, EntityType.GEM, [ spatialComp,
                                     renderComp,
                                     behaviourComp ]);

  const spatialSys = <SpatialSystem>em.getSystem(ComponentType.SPATIAL);
  spatialSys.setStaticPos(id, entity.desc.x, entity.desc.y);
}
