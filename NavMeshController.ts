import { Component, PropTypes, Vec3 } from "horizon/core";
import NavMeshManager, { NavMesh, NavMeshState } from "horizon/navmesh";
import { debugLog } from "sysHelper";

const NAVMESHPROFILE_NAVIGATION = "Navigation";
const NAVMESHPROFILE_RESOURCES = "Resources";
const NAVIGATION_NEARESTPOINT_RANGE = 5;
const RESOURCE_NEARESTPOINT_RANGE = 10;

export class NavMeshController extends Component<typeof NavMeshController> {
  static propsDefinition = {
    resourceGizmo: { type: PropTypes.Entity },
    debugLogging: { type: PropTypes.Boolean, default: false },
  };

  private static instance: NavMeshController | undefined;

  private areNavMeshesInitialized = false;
  private navMeshesNavigation: NavMesh[] = [];
  private navMeshesResources: NavMesh[] = [];

  private gizmoAreaPoints = {
    minX: 99999999999,
    minY: 99999999999,
    minZ: 99999999999,
    maxX: -99999999999,
    maxY: -99999999999,
    maxZ: -99999999999,
  };

  async preStart() {
    NavMeshController.instance = this;
    if (this.props.resourceGizmo) {
      this.computeGizmoAreaPoints();
    }
  }

  async start() {
    await this.initializeNavMeshes();
  }

  public static getWaypointsBetween(startPosition: Vec3, targetPosition: Vec3) {
    const navMeshController = NavMeshController.instance;
    if (!navMeshController?.areNavMeshesInitialized) {
      console.error("NavMeshes are initializing");
      return;
    }

    if (navMeshController.navMeshesNavigation.length === 0) {
      console.error("No Navigation NavMeshes available");
      return;
    }

    // For now, use only first navigation NavMesh for pathfinding
    const navMesh = navMeshController.navMeshesNavigation[0];
    if (navMesh.getStatus().state !== NavMeshState.Ready) {
      console.error("Navigation NavMesh is not ready");
      return;
    }

    const nearestStartPosition = navMesh.getNearestPoint(startPosition, NAVIGATION_NEARESTPOINT_RANGE) ?? undefined;
    if (nearestStartPosition === undefined) {
      console.error("Could not find nearest start position on NavMesh");
      return;
    }

    const nearestTargetPosition = navMesh.getNearestPoint(targetPosition, NAVIGATION_NEARESTPOINT_RANGE) ?? undefined;
    if (nearestTargetPosition === undefined) {
      console.error("Could not find nearest target position on NavMesh");
      return;
    }

    const path = navMesh.getPath(nearestStartPosition, nearestTargetPosition) ?? undefined;
    if (path === undefined) {
      console.error("Path is not available");
      return;
    }

    const waypoints = path.waypoints;
    return waypoints;
  }

  protected async initializeNavMeshes() {
    const navMeshManager = NavMeshManager.getInstance(this.world);
    const navMeshes = await navMeshManager.getNavMeshes();
    if (navMeshes.length === 0) {
      console.error("No NavMeshes available in the world");
      return;
    }

    for (let i = 0; i < navMeshes.length; i++) {
      const navMesh = navMeshes[i];
      if (navMesh.profile.name === NAVMESHPROFILE_NAVIGATION) {
        debugLog(this.props.debugLogging, "NavMeshController: Adding Navigation NavMesh");
        this.navMeshesNavigation.push(navMesh);
      } else if (navMesh.profile.name === NAVMESHPROFILE_RESOURCES) {
        debugLog(this.props.debugLogging, "NavMeshController: Adding Resources NavMesh");
        this.navMeshesResources.push(navMesh);
      }

      await navMesh.rebake().then((success) => {
        if (!success) {
          console.error("NavMesh rebake failed for profile:", navMesh.profile.name);
        }
      });
    }

    this.areNavMeshesInitialized = true;
  }

  protected computeGizmoAreaPoints() {
    if (!this.props.resourceGizmo) {
      console.error("NavMeshController: No resourceGizmo entity.");
      return;
    }

    // This calculates the area covered by the gizmo
    // This is used to limit the random point search area
    // to improve performance and avoid getting points
    // that are outside the gizmo area.
    // It does account for rotation and scale of the gizmo.
    const gizmoPosition = this.props.resourceGizmo.position.get();
    const gizmoScale = this.props.resourceGizmo.scale.get();
    const gizmoForward = this.props.resourceGizmo.forward.get();
    const gizmoRight = this.props.resourceGizmo.right.get();
    const gizmoUp = this.props.resourceGizmo.up.get();

    const gizmoCoordinates = [
      gizmoPosition.add(gizmoRight.mul(gizmoScale.x / 2)), //
      gizmoPosition.add(gizmoRight.mul(-gizmoScale.x / 2)),
      gizmoPosition.add(gizmoUp.mul(gizmoScale.y / 2)),
      gizmoPosition.add(gizmoUp.mul(-gizmoScale.y / 2)),
      gizmoPosition.add(gizmoForward.mul(gizmoScale.z / 2)),
      gizmoPosition.add(gizmoForward.mul(-gizmoScale.z / 2)),
    ];

    gizmoCoordinates.forEach((point) => {
      if (point.x < this.gizmoAreaPoints.minX) this.gizmoAreaPoints.minX = point.x;
      if (point.x > this.gizmoAreaPoints.maxX) this.gizmoAreaPoints.maxX = point.x;
      if (point.y < this.gizmoAreaPoints.minY) this.gizmoAreaPoints.minY = point.y;
      if (point.y > this.gizmoAreaPoints.maxY) this.gizmoAreaPoints.maxY = point.y;
      if (point.z < this.gizmoAreaPoints.minZ) this.gizmoAreaPoints.minZ = point.z;
      if (point.z > this.gizmoAreaPoints.maxZ) this.gizmoAreaPoints.maxZ = point.z;
    });
  }

  public static async getRandomPointInResourceGizmo(areaPoints?: Vec3[]): Promise<Vec3 | undefined> {
    const navMeshController = NavMeshController.instance;
    if (!navMeshController?.areNavMeshesInitialized) {
      console.error("NavMeshes are initializing");
      return;
    }

    if (navMeshController.navMeshesResources.length === 0) {
      console.error("No Resource NavMeshes available");
      return;
    }

    // For now, use only first resource NavMesh for random point
    const navMesh = navMeshController.navMeshesResources[0];
    if (navMesh.getStatus().state !== NavMeshState.Ready) {
      console.error("Resource NavMesh is not ready");
      return;
    }

    return new Promise((resolve, reject) => {
      navMesh
        ?.rebake()
        .then((success) => {
          let requiredPoints = { ...navMeshController.gizmoAreaPoints };

          if (areaPoints && areaPoints.length > 0) {
            let minX = 99999999999;
            let maxX = -99999999999;
            let minY = 99999999999;
            let maxY = -99999999999;
            let minZ = 99999999999;
            let maxZ = -99999999999;

            areaPoints.forEach((point) => {
              if (point.x < minX) minX = point.x;
              if (point.x > maxX) maxX = point.x;
              if (point.y < minY) minY = point.y;
              if (point.y > maxY) maxY = point.y;
              if (point.z < minZ) minZ = point.z;
              if (point.z > maxZ) maxZ = point.z;
            });

            requiredPoints = { minX, maxX, minY, maxY, minZ, maxZ };
          }
          const randomX = Math.random() * (requiredPoints.maxX - requiredPoints.minX) + requiredPoints.minX;
          const randomY = Math.random() * (requiredPoints.maxY - requiredPoints.minY) + requiredPoints.minY;
          const randomZ = Math.random() * (requiredPoints.maxZ - requiredPoints.minZ) + requiredPoints.minZ;

          const randomPoint = new Vec3(randomX, randomY, randomZ);
          const nearestPoint = navMesh.getNearestPoint(randomPoint, RESOURCE_NEARESTPOINT_RANGE);

          if (nearestPoint) {
            resolve(nearestPoint);
          } else {
            //console.warn("getRandomPointInResourceGizmo: No valid point found within range");
            resolve(undefined);
          }
        })
        .catch((error) => {
          console.error("Error rebaking NavMesh:", error);
          reject(undefined);
        });
    });
  }
}
Component.register(NavMeshController);
