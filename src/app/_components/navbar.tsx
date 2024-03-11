"use client";

import styles from "./navbar.module.scss";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Select } from "@mantine/core";

import defaultImg from "@/assets/icons/defaultProtocol.svg";
import tokensImg from "@/assets/icons/token.svg";
import walletsImg from "@/assets/icons/wallet.svg";
import protocolsImg from "@/assets/icons/protocol.svg";
import fishImg from "@/assets/icons/fish.svg";
import tableImg from "@/assets/icons/table.svg";
import graphImg from "@/assets/icons/graph.svg";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

import { titleCase } from "../_utils/textHandling";
import { useEffect, useState } from "react";

import { usePathname } from "next/navigation";

export default function Navbar({ protocols }) {
  const supabase = createClientComponentClient();

  const pathname = usePathname();
  const [session, setSession] = useState(null);
  const [selectedPath, setSelectedPath] = useState([]);
  const router = useRouter();

  const pathOptions = {
    protocols: {
      label: "Protocols",
      value: "protocols",
      icon: protocolsImg,
      placeholder: "Protocol",
      subPaths: protocols.reduce((protocolNames, entry) => {
        protocolNames[entry.name] = {
          label: titleCase(entry.name),
          value: entry.name,
          icon: `/protocolIcons/${entry.name}.svg`,
          placeholder: "Chain",
          subPaths: protocols.reduce((marketNames, innerEntry) => {
            if (innerEntry.name === entry.name) {
              marketNames[innerEntry.protocol] = {
                label: `${titleCase(innerEntry.chain)} v${innerEntry.version}`,
                value: innerEntry.protocol,
                icon: `/protocolTokenIcons/${innerEntry.chain}.svg`,
                placeholder: "Mode",
                // default: "positions",
                subPaths: {
                  positions: {
                    label: "Positions",
                    value: "positions",
                    icon: walletsImg || defaultImg,
                    placeholder: "View",
                    // default: "table",
                    subPaths: {
                      table: {
                        label: "Table",
                        value: "table",
                        icon: tableImg || defaultImg,
                      },
                      graph: {
                        label: "Graph",
                        value: "graph",
                        icon: graphImg || defaultImg,
                      },
                    },
                  },
                  // markets: {
                  //   label: "Markets",
                  //   value: "markets",
                  //   icon: tokensImg || defaultImg,
                  //   placeholder: "View",
                  //   // default: "table",
                  //   subPaths: {
                  //     table: {
                  //       label: "Table",
                  //       value: "table",
                  //       icon: tableImg || defaultImg,
                  //     },
                  //     // graph: {
                  //     //   label: "Graph",
                  //     //   value: "graph",
                  //     //   icon: graphImg || defaultImg,
                  //     // },
                  //   },
                  // },
                },
              };
            }
            return marketNames;
          }, {}),
        };

        return protocolNames;
      }, {}),
    },
    // wallets: {
    //   label: "Wallets",
    //   value: "wallets",
    //   icon: walletsImg || defaultImg,
    // },
    // tokens: {
    //   label: "Tokens",
    //   value: "tokens",
    //   icon: tokensImg,
    // },
    position: {
      label: "Position",
      value: "position",
      icon: walletsImg || defaultImg,
      placeholder: "Address",
    },
    account: {
      label: "Account",
      value: "account",
      icon: fishImg,
      placeholder: "Actions",
    },
  };

  useEffect(() => {
    async function fetchSession() {
      const session = await supabase.auth.getSession();
      setSession(session.data.session);
    }
    fetchSession();

    const newSelectedPath = pathname.split("/").filter((path) => path !== "");
    setSelectedPath(newSelectedPath);
  }, [pathname]);

  // supabase.auth.onAuthStateChange((event, session) => {
  //   setSession(session);
  // });

  function SelectItem({ value, label, icon, index, ...others }) {
    let hrefArr = selectedPath.slice(0, index + 1);
    hrefArr[index] = value;
    const href = hrefArr.join("/");

    return (
      <Link
        href={`/${href}`}
        style={{ textDecoration: "none" }}
        className={styles.selectItem}
      >
        <Image src={icon} alt={label} width={32} height={32} />
        {label}
      </Link>
    );
  }

  type DirectoryItem = {
    value: string;
    label: string;
    icon: any;
  };

  function directoryToData(directory: Record<string, DirectoryItem>) {
    const data = Object.entries(directory).map(([key, value]) => {
      return {
        value: value.value,
        label: value.label,
        icon: value.icon,
      };
    });

    return data;
  }

  function renderIcon(icon) {
    return (
      <Image
        src={icon || walletsImg}
        alt="icon"
        width={28}
        height={28}
        className={styles.selectIcon}
      />
    );
  }

  return (
    <div className={styles.navbar}>
      <div className={styles.section}>
        <Link href="/" rel="noreferrer" style={{ textDecoration: "none" }}>
          <svg
            width="260"
            height="260"
            viewBox="0 0 260 260"
            fill="none"
            className={styles.anthiasLogo}
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M71.9396 3.17262C69.1382 6.26476 69.1428 6.48762 72.0759 11.9306C75.4812 18.2511 94.0612 38.6394 100.76 43.4061L105.183 46.5524L111.582 42.3212L117.981 38.0885L113.578 34.9654C111.156 33.2475 104.994 27.8246 99.8838 22.914L90.5923 13.9874L130.081 14.0245L169.57 14.0617L158.842 24.1475C148.77 33.6143 137.868 41.371 116.647 54.1667C106.078 61.3561 71.6144 94.1324 61.6601 107.756L54.7317 117.238L49.434 109.41C41.8846 98.2583 22.1866 78.5788 13.6322 73.6435C7.71506 70.2279 5.76694 69.762 3.17925 71.1456C0.0619434 72.8139 0 73.9437 0 129.17C0 178.309 0.309717 185.804 2.43283 187.926C3.77236 189.263 5.78552 190.357 6.90825 190.357C10.422 190.357 26.6729 177.408 36.8331 166.515L46.5676 156.079L43.1669 150.39C38.0581 141.842 37.9744 141.822 33.5997 148.13C31.3635 151.357 26.024 157.45 21.7344 161.672L13.9373 169.348V130.973C13.9373 100.968 14.36 92.738 15.873 93.2332C19.633 94.4636 38.8633 118.212 46.758 131.371C51.1576 138.704 57.7793 148.67 61.4742 153.519C70.1308 164.879 90.6001 184.995 104.946 196.237L116.203 205.06L111.218 208.929C96.1084 220.655 86.151 230.134 79.1312 239.472C70.7379 250.642 69.8103 253.712 73.6678 257.569C75.7878 259.686 83.0925 260 130.293 260C164.688 260 185.58 259.415 187.481 258.398C194.249 254.778 189.341 244.775 172.081 227.003C158.464 212.985 157.716 212.638 150.173 216.876C146.787 218.776 144.023 220.726 144.029 221.207C144.036 221.689 146.3 223.623 149.062 225.505C151.825 227.387 157.894 232.784 162.549 237.499L171.014 246.071H131.929H92.844L95.3031 242.32C99.1963 236.383 118.156 221.271 132.689 212.521C140.012 208.111 151.333 200.31 157.846 195.181C169.225 186.225 192.965 160.932 200.777 149.44C202.839 146.408 204.753 143.929 205.031 143.929C205.309 143.929 209.112 148.734 213.482 154.609C222.541 166.782 240.074 183.583 248.392 188.06C252.72 190.39 254.634 190.696 256.701 189.393C259.158 187.844 259.424 182.876 259.811 131.379C260.232 75.496 260.209 75.0379 256.928 72.3496C253.758 69.7512 253.366 69.7821 247.466 73.0971C240.026 77.2757 224.983 90.6796 218.376 99.0167L213.562 105.09L217.748 111.412L221.936 117.734L226.718 111.873C234.984 101.745 243.469 92.8571 244.873 92.8571C245.617 92.8571 246.196 110.093 246.159 131.161L246.092 169.464L236 158.742C226.715 148.876 221.866 142.109 205.497 116.169C197.497 103.492 168.369 72.1577 155.81 62.7188C150.176 58.4845 145.567 54.5737 145.567 54.0258C145.567 53.478 148.252 51.2541 151.535 49.0827C165.694 39.7196 190.476 12.8762 190.476 6.90393C190.476 5.7819 189.381 3.77 188.043 2.43131C185.922 0.311071 178.509 0 130.211 0C76.3267 0 74.7333 0.0866664 71.9396 3.17262ZM149.516 82.7527C162.529 89.0933 175.142 102.121 179.538 113.761C188.104 136.443 176.039 163.685 151.379 177.34C144.297 181.262 141.079 183.292 130.293 183.292C119.12 183.292 117.507 181.325 108.671 176.537C90.9578 166.94 78.9764 148.217 78.9795 130.139C78.981 110.823 91.1808 92.4192 110.388 82.7527C120.288 77.771 122.634 77.1937 130.933 77.6951C137.22 78.0758 143.331 79.738 149.516 82.7527Z"
            />
          </svg>
        </Link>
        {selectedPath.length > 0 ? (
          selectedPath.map((path, index) => {
            let directory = pathOptions;
            for (let i = 0; i < index; i++) {
              directory =
                directory && directory[selectedPath[i]].subPaths
                  ? directory[selectedPath[i]].subPaths
                  : null;
            }
            const isLast = index === selectedPath.length - 1;

            if (
              directory &&
              isLast &&
              directory[selectedPath[index]] &&
              directory[selectedPath[index]].default
            ) {
              let hrefArr = selectedPath.slice(0, index + 1);
              hrefArr.push(directory[selectedPath[index]].default);
              const href = hrefArr.join("/");

              router.push(`/${href}`);
            }

            return (
              <>
                {directory && directory[selectedPath[index]] && (
                  <>
                    <svg
                      width="21"
                      height="50"
                      viewBox="0 0 21 50"
                      className={styles.slash}
                    >
                      <line
                        x1="20.4629"
                        y1="0.188948"
                        x2="0.462925"
                        y2="49.1889"
                      />
                    </svg>
                    <Select
                      data={directoryToData(directory)}
                      itemComponent={(props) => (
                        <SelectItem {...props} index={index} />
                      )}
                      value={selectedPath[index]}
                      icon={renderIcon(directory[selectedPath[index]].icon)}
                      classNames={{
                        root: styles.select,
                        dropdown: styles.selectDropdown,
                        input: styles.selectInput,
                        icon: styles.selectIcon,
                      }}
                    />
                    {isLast && directory[selectedPath[index]].subPaths && (
                      <>
                        <svg
                          width="21"
                          height="50"
                          viewBox="0 0 21 50"
                          className={styles.slash}
                        >
                          <line
                            x1="20.4629"
                            y1="0.188948"
                            x2="0.462925"
                            y2="49.1889"
                          />
                        </svg>
                        <Select
                          data={directoryToData(
                            directory[selectedPath[index]].subPaths
                          )}
                          itemComponent={(props) => (
                            <SelectItem {...props} index={index + 1} />
                          )}
                          value={selectedPath[index]}
                          placeholder={
                            directory[selectedPath[index]].placeholder
                          }
                          classNames={{
                            root: styles.select,
                            dropdown: styles.selectDropdown,
                            input: styles.selectInput,
                            icon: styles.selectIcon,
                          }}
                        />
                      </>
                    )}
                  </>
                )}
              </>
            );
          })
        ) : (
          <>
            <svg
              width="21"
              height="50"
              viewBox="0 0 21 50"
              className={styles.slash}
            >
              <line x1="20.4629" y1="0.188948" x2="0.462925" y2="49.1889" />
            </svg>
            <Select
              data={directoryToData(pathOptions)}
              itemComponent={(props) => <SelectItem {...props} index={0} />}
              placeholder="Category"
              value={selectedPath[0]}
              classNames={{
                root: styles.select,
                dropdown: styles.selectDropdown,
                input: styles.selectInput,
                icon: styles.selectIcon,
              }}
            />
          </>
        )}
      </div>

      {/* <div className={styles.section}>
        {session ? (
          <Link
            href="/account"
            rel="noreferrer"
            style={{ textDecoration: "none" }}
            className={styles.account}
          >
            Account
          </Link>
        ) : (
          <Link
            href="/account/login"
            rel="noreferrer"
            style={{ textDecoration: "none" }}
            className={styles.account}
          >
            Log In
          </Link>
        )}
      </div> */}
    </div>
  );
}
