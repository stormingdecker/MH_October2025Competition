import { Component, PropTypes, Vec3, World } from 'horizon/core';
import NavMeshManager, { NavMesh } from 'horizon/navmesh';

class NavMeshDemo extends Component<typeof NavMeshDemo> {
    static propsDefinition = {
        targetRef: { type: PropTypes.Entity },
    };
    private navMesh: NavMesh | undefined;
    private originalPosition = Vec3.zero;
    private targetPosition = Vec3.zero;

    preStart() {
        if (this.props.targetRef) {
            this.targetPosition = this.props.targetRef.position.get();
        } else {
            console.error('Target reference is not set');
        }

        this.originalPosition = this.entity.position.get();
    }

    start() {
        this.async.setTimeout(this.delayedStart.bind(this), 5000);
        const Manager = NavMeshManager.getInstance(this.world);
        Manager.getByName('Maze')
            .then((navmesh) => {
                if (!navmesh) {
                    console.error('NavMesh is not available');
                    return;
                }

                this.navMesh = navmesh;
                this.navMesh.rebake();
            })
            .catch((error) => {
                console.error('Error getting NavMesh: ' + error);
            });
    }

    private delayedStart() {
        if (!this.navMesh) {
            console.error('NavMesh is not available');
            return
        }

        const path = this.navMesh.getPath(this.originalPosition, this.targetPosition);

        if (!path) {
            console.error('Path is not available');
        } else {
            this.navigateToPath(path.waypoints);
        }
    }

    private navigateToPath(path: Vec3[]) {
        let index = 0;
        let from = this.entity.position.get();
        let to = path[index];
        let distance = from.distance(to); // Note: navmesh has an API to calculate 2.5 distances. Using this for simplicity.
        let time = distance / 1;
        let duration = 0;
        const subscription = this.connectLocalBroadcastEvent(World.onUpdate, ({ deltaTime }) => {
            duration += deltaTime;
            if (duration >= time) {
                this.entity.position.set(to);
                index++;
                if (index < path.length) {
                    from = to;
                    to = path[index];
                    distance = from.distance(to);
                    time = distance / 5;
                    duration = 0;
                } else {
                    subscription.disconnect();
                }
            } else {
                this.entity.position.set(Vec3.lerp(from, to, duration / time));
            }
        })
    }


}
Component.register(NavMeshDemo);
