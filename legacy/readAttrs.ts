import { AttrChangeInfo, AttrParts, MountInit } from "../ts-refs/mount-observer/types";

export function readAttrs(
    match: Element, mountInit: MountInit, branchIndexes?: Set<number>,
    fullListOfEnhancementAttrs?: string[],
    attrParts?: AttrParts[],
){
        //TODO:  externalize
        const fullListOfAttrs = fullListOfEnhancementAttrs;
        const attrChangeInfos: Array<AttrChangeInfo> = [];
        const oldValue = null;
        if(fullListOfAttrs !== undefined){
            
            
            for(let idx = 0, ii = fullListOfAttrs.length; idx < ii; idx++){
                const parts = attrParts![idx];
                const {branchIdx} = parts;
                if(branchIndexes !== undefined){
                    if(!branchIndexes.has(branchIdx)) continue;
                }
                const name = fullListOfAttrs[idx];
                
                const newValue = match.getAttribute(name);
                
                attrChangeInfos.push({
                    idx,
                    isSOfTAttr: false,
                    newValue,
                    oldValue,
                    name,
                    parts
                });
            }

        }
        const {observedAttrsWhenMounted} = mountInit;
        if(observedAttrsWhenMounted !== undefined){
            for(const observedAttr of observedAttrsWhenMounted){
                const attrIsString = typeof observedAttr === 'string';
                const name = attrIsString ? observedAttr : observedAttr.name;
                let mapsTo: string | undefined;
                let newValue = match.getAttribute(name);
                if(!attrIsString){
                    const {customParser, instanceOf, mapsTo: mt, valIfNull} = observedAttr;
                    if(instanceOf || customParser) throw 'NI';
                    if(newValue === null) newValue = valIfNull;
                    mapsTo = mt;
                }
                attrChangeInfos.push({
                    isSOfTAttr: true,
                    newValue,
                    oldValue,
                    name,
                    mapsTo
                });
            }
        }

        return attrChangeInfos;
    }